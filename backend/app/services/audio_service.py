import io
import json
import numpy as np
import soundfile as sf
import librosa
import pickle
import tempfile
import os
import mimetypes
from typing import Optional
from fastapi import UploadFile, HTTPException
from pathlib import Path
from app.core.config import settings
from app.core.logger import setup_logger
from app.utils.image_utils import save_upload_file

import tensorflow as tf
from tensorflow.keras.models import model_from_json

logger = setup_logger(__name__)


class AudioService:
    """Service to handle audio uploads and predictions."""
    def __init__(self):
        self.model = None
        # Emotion order used by the audio model (7 classes)
        self.emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self.scaler = None
        self.encoder = None
        # preprocessing params (from notebook - MUST match training)
        self.n_mfcc = 30
        self.expected_size = 2376
        self.duration = 2.5
        self.offset = 0.6
        self.target_sr = 22050  # Sample rate used during training

    def _load_model(self):
        if self.model is not None:
            return self.model

        model_path = settings.AUDIO_MODEL_PATH
        json_path = settings.MODEL_DIR / 'audio' / 'CNN_model.json'

        try:
            # Try to load a full model first
            logger.info(f"Loading audio model from {model_path}")
            self.model = tf.keras.models.load_model(model_path, compile=False)
            logger.info("Audio model loaded from single-file model.")
        except Exception:
            logger.info("Could not load single-file model, trying JSON + weights...")

            if json_path.exists() and model_path.exists():
                try:
                    with open(json_path, 'r') as f:
                        model_json = f.read()
                    self.model = model_from_json(model_json)
                    # load weights
                    self.model.load_weights(str(model_path))
                    logger.info("Audio model loaded from JSON + weights.")
                except Exception as e:
                    logger.error(f"Failed to load model from JSON+weights: {e}")
                    raise
            else:
                raise FileNotFoundError(f"Audio model not found at {model_path}")

        # Try to load scaler and encoder pickles if present (from models/audio)
        scaler_path = settings.MODEL_DIR / 'audio' / 'scaler2.pickle'
        encoder_path = settings.MODEL_DIR / 'audio' / 'encoder2.pickle'
        try:
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                logger.info(f"Loaded scaler from {scaler_path}")
            else:
                logger.info("No scaler2.pickle found; predictions will skip scaling")

            if encoder_path.exists():
                with open(encoder_path, 'rb') as f:
                    self.encoder = pickle.load(f)
                logger.info(f"Loaded encoder from {encoder_path}")
            else:
                logger.info("No encoder2.pickle found; using default emotion order")
        except Exception as e:
            logger.warning(f"Could not load scaler/encoder: {e}")

        return self.model

    # --- Audio feature extraction helpers (from training notebook) ---
    def _zcr(self, data, frame_length=2048, hop_length=512):
        z = librosa.feature.zero_crossing_rate(data, frame_length=frame_length, hop_length=hop_length)
        return np.squeeze(z)

    def _rmse(self, data, frame_length=2048, hop_length=512):
        r = librosa.feature.rms(y=data, frame_length=frame_length, hop_length=hop_length)
        return np.squeeze(r)

    def _mfcc(self, data, sr, frame_length=2048, hop_length=512, flatten: bool = True):
        m = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=self.n_mfcc)
        return np.squeeze(m.T) if not flatten else np.ravel(m.T)

    def _extract_features(self, data, sr=22050, frame_length=2048, hop_length=512):
        result = np.array([])
        result = np.hstack((
            result,
            self._zcr(data, frame_length, hop_length),
            self._rmse(data, frame_length, hop_length),
            self._mfcc(data, sr, frame_length, hop_length)
        ))
        return result

    def _get_predict_feat_from_array(self, data, sr):
        # slice to duration with offset (mimic librosa.load(..., duration=2.5, offset=0.6))
        start = int(self.offset * sr)
        length = int(self.duration * sr)
        end = start + length

        if start >= data.shape[0]:
            d = np.zeros(length, dtype='float32')
        else:
            d = data[start:end]
            if d.shape[0] < length:
                pad_len = length - d.shape[0]
                d = np.pad(d, (0, pad_len), 'constant')

        res = self._extract_features(d, sr)
        result = np.array(res)

        # Pad or truncate the features to match the expected size (2376)
        if result.shape[0] < self.expected_size:
            result = np.pad(result, (0, self.expected_size - result.shape[0]), 'constant')
        elif result.shape[0] > self.expected_size:
            result = result[:self.expected_size]

        result = np.reshape(result, newshape=(1, self.expected_size))

        if self.scaler is not None:
            try:
                i_result = self.scaler.transform(result)
            except Exception:
                # fallback to raw if scaler fails
                i_result = result
        else:
            i_result = result

        final_result = np.expand_dims(i_result, axis=2)
        return final_result.astype('float32')

    async def process_audio(self, file: UploadFile):
        """Validate and save uploaded audio file."""
        try:
            allowed = set(settings.ALLOWED_AUDIO_TYPES)
            allowed.add("video/webm")
            if file.content_type not in allowed:
                raise HTTPException(status_code=400, detail=f"Audio type not allowed: {file.content_type}")

            saved = await save_upload_file(file, 'audios')
            return {"message": "File uploaded successfully", "file_path": str(saved)}
        except Exception as e:
            logger.error(f"Error saving audio file: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    async def predict(self, audio_input, content_type: Optional[str] = None):
        """Predict emotion from WAV audio file.

        Frontend converts all audio formats to WAV before sending.
        The model expects a 1D feature vector of length 2376 (shape (1,2376,1)).
        """
        try:
            # Load model lazily
            model = self._load_model()

            # Read audio bytes
            if hasattr(audio_input, 'read'):
                logger.info(f"Reading audio from UploadFile: {getattr(audio_input, 'filename', 'unknown')}")
                content_type = getattr(audio_input, 'content_type', content_type)
                contents = await audio_input.read()
            elif isinstance(audio_input, (bytes, bytearray)):
                logger.info(f"Reading audio from bytes: {len(audio_input)} bytes")
                contents = bytes(audio_input)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported audio input type: {type(audio_input)}")

            buffer = io.BytesIO(contents)

            # Try fast path: soundfile (works for WAV/FLAC)
            try:
                data, sr = sf.read(buffer, dtype='float32')
                logger.info(f"Loaded audio via soundfile: {len(data)} samples, sample rate: {sr} Hz")
            except Exception as e_sf:
                logger.warning(f"soundfile could not decode audio: {e_sf}. Falling back to librosa/audioread")
                buffer.seek(0)
                tmp_file = None
                try:
                    suffix = self._guess_extension(content_type)
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix or '.bin') as tmp:
                        tmp.write(buffer.read())
                        tmp_file = tmp.name

                    data, sr = librosa.load(tmp_file, sr=None, mono=True)
                    logger.info(f"Loaded audio via librosa: {len(data)} samples, sample rate: {sr} Hz")
                except Exception as e_lib:
                    logger.error(f"Error decoding audio bytes: {e_lib}")
                    raise HTTPException(status_code=400, detail=f"Cannot read audio file: {e_lib}") from e_lib
                finally:
                    if tmp_file and os.path.exists(tmp_file):
                        try:
                            os.remove(tmp_file)
                        except OSError:
                            pass

            # Ensure numpy array and mono float32
            data = np.asarray(data, dtype='float32')
            if data.ndim > 1:
                data = np.mean(data, axis=1)
                logger.info("Converted stereo to mono")

            # Resample to target sample rate (22050 Hz) if different
            # This is CRITICAL - model was trained with 22050 Hz audio
            if sr != self.target_sr:
                logger.info(f"Resampling from {sr} Hz to {self.target_sr} Hz")
                data = librosa.resample(data, orig_sr=sr, target_sr=self.target_sr)
                sr = self.target_sr
                logger.info(f"Resampled to {sr} Hz")

            # Build feature vector using notebook pipeline
            feat_arr = self._get_predict_feat_from_array(data, sr)

            # Predict
            preds = model.predict(feat_arr)
            preds = np.asarray(preds).squeeze()

            logger.info(f"Raw predictions shape: {preds.shape}, values: {preds}")

            # Use encoder to get emotion labels (matching training process)
            if self.encoder is not None and hasattr(self.encoder, 'categories_'):
                # Get emotion labels from encoder (same order as training)
                emotion_labels = list(self.encoder.categories_[0])

                # Use inverse_transform to get predicted emotion (matching training)
                # Reshape predictions to 2D for inverse_transform
                preds_2d = preds.reshape(1, -1)
                y_pred = self.encoder.inverse_transform(preds_2d)
                predicted_emotion = y_pred[0][0]

                # Build confidence scores for all emotions
                all_emotions = {}
                for i, emotion in enumerate(emotion_labels):
                    all_emotions[emotion] = float(preds[i])

                # Get confidence for predicted emotion
                confidence = float(preds[emotion_labels.index(predicted_emotion)])

                logger.info(f"Predicted emotion: {predicted_emotion}, confidence: {confidence}")

                return {
                    "emotion": predicted_emotion,
                    "confidence": confidence,
                    "all_emotions": all_emotions
                }
            else:
                # Fallback: no encoder, use default emotion order
                logger.warning("No encoder found, using default emotion order")
                labels = self.emotions
                all_emotions = {labels[i]: float(preds[i]) for i in range(min(len(labels), preds.size))}
                top_idx = int(np.argmax(preds))
                emotion = labels[top_idx]
                confidence = float(preds[top_idx])

                return {"emotion": emotion, "confidence": confidence, "all_emotions": all_emotions}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in audio prediction: {e}")
            raise HTTPException(status_code=400, detail=str(e))

    def _guess_extension(self, content_type: Optional[str]) -> Optional[str]:
        if not content_type:
            return None
        ext = mimetypes.guess_extension(content_type)
        if ext:
            return ext
        if content_type == 'video/webm':
            return '.webm'
        return None

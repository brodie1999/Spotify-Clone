# Fixed version of app/backend/services/audio_processing.py

import librosa
import numpy as np
from mutagen import File as MutagenFile
import logging
from typing import Dict
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class AudioProcessingService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=2)

    async def analyze_audio_async(self, file_path: str) -> Dict:
        """ASYNC WRAPPER FOR AUDIO ANALYSIS"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self._analyze_audio_sync,
            file_path,
        )

    def _analyze_audio_sync(self, file_path: str) -> Dict:
        """SYNCHRONOUS AUDIO ANALYSIS USING LIBROSA"""
        try:
            logger.info(f"Starting audio analysis for: {file_path}")

            # Load audio file
            y, sr = librosa.load(file_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)

            # Extract features
            features = {}

            #1. Tempo (BPM)
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            features["tempo"] = float(tempo)

            # 2. key detection
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            key = self._detect_key(chroma)
            features['musical_key'] = key

            # 3. Energy
            rms = librosa.feature.rms(y=y)[0]
            energy = float(np.mean(rms))
            features['energy'] = min(energy * 10, 1.0) # Normalise to 0-1

            #4. Spectral features for genre/mood prediction
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

            # 5. Genre prediction (simple rule-based)
            genre = self._predict_genre(
                tempo=features["tempo"],
                energy=features["energy"],
                spectral_centroids=spectral_centroids,
                mfccs=mfccs,
            )
            features["genre"] = genre

            # 6. Mood Prediction
            mood = self._predict_mood(
                energy=features["energy"],
                tempo=features["tempo"],
                key=key
            )
            features['mood'] = mood

            # 7. Danceability
            danceability = self._calculate_danceability(
                tempo=features["tempo"],
                energy=features["energy"],
            )
            features['danceability'] = danceability

            # Additional metadata
            features['duration'] = float(duration)
            features['sample_rate'] = int(sr)

            logger.info(f"Audio analysis complete for: {file_path}")
            return {
                'success': True,
                'features': features,
                'message': 'Analysis completed successfully'
            }
        except Exception as e:
            logger.error(f"Error analyzing audio: {str(e)}")
            return {
                'success': False,
                'features': {},
                'message': f'Analysis failed: {str(e)}'
            }

    def _detect_key(self, chroma) -> str:
        """SIMPLE KEY DETECTION BASED ON CHROMA FEATURES"""
        # Avg chroma across time
        chroma_mean = np.mean(chroma, axis=1)

        #key names
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

        # find the most prominent note
        key_index = np.argmax(chroma_mean)

        # Simple major/minor detection based on third interval
        third_index = (key_index + 4) % 12
        if chroma_mean[third_index] > chroma_mean[(key_index + 3) % 12]:
            mode = "Major"
        else:
            mode = "Minor"

        return f"{keys[key_index]} {mode}"

    def _predict_genre(self, tempo: float, energy: float, spectral_centroids, mfccs) -> str:
        """Simple genre prediction based on audio features"""
        avg_spectral_centroid = np.mean(spectral_centroids)

        # Rule-based genre classification
        if tempo > 140 and energy > 0.7:
            if avg_spectral_centroid > 3000:
                return "Electronic"
            else:
                return "Rock"
        elif tempo > 120 and energy > 0.5:
            if avg_spectral_centroid > 2000:
                return "Pop"
            else:
                return "Hip-Hop"
        elif tempo < 80:
            return "Ballad"
        elif 80 <= tempo <= 120:
            if energy < 0.3:
                return "Ambient"
            else:
                return "Folk"
        else:
            return "Pop" # Default

    def _predict_mood(self, energy: float, tempo: float, key: str) -> str:
        """Simple mood prediction"""
        is_minor = "Minor" in key

        if energy > 0.7 and tempo > 120:
            return "Energetic"
        elif energy > 0.5 and tempo > 120:
            return "Happy" if not is_minor else "Intense"
        elif energy < 0.3:
            return "Calm"
        elif is_minor:
            return "Melancholic"
        else:
            return "Peaceful"

    def _calculate_danceability(self, tempo: float, energy: float) -> float:
        """Calculate danceability score (0-1)"""
        # Optimal dance tempo is around 120-130 BPM
        tempo_score = 1.0 - abs(tempo - 125) / 125
        tempo_score = max(0, tempo_score)

        # combine with energy
        danceability = (tempo_score * 0.6 + energy * 0.4)
        return min(1.0, max(0.0, danceability))

    def extract_metadata(self, file_path: str) -> dict:
        """Extract metadata from audio file"""
        try:
            audio_file = MutagenFile(file_path)
            if audio_file is None:
                return {}

            metadata = {}

            # common metadata fields
            if hasattr(audio_file, 'tags') and audio_file.tags:
                tags = audio_file.tags

                # Title
                for key in ['TIT2', 'TITLE', '\xa9nam']:
                    if key in tags:
                        metadata['title'] = str(tags[key][0])
                        break
                # Artist
                for key in ['TPE1', 'ARTIST', '\xa9ART']:
                    if key in tags:
                        metadata['artist'] = str(tags[key][0])
                        break
                # Album
                for key in ['TALB', 'ALBUM', '\xa9alb']:
                    if key in tags:
                        metadata['album'] = str(tags[key][0])
                        break
                # Genre
                for key in ['TCON', 'GENRE', '\xa9gen']:
                    if key in tags:
                        metadata['genre'] = str(tags[key][0])
                        break

            if hasattr(audio_file, 'info'):
                info = audio_file.info
                metadata['duration'] = getattr(info, 'length', 0)
                metadata['bitrate'] = getattr(info, 'bitrate', 0)
                metadata['sample_rate'] = getattr(info, 'sample_rate', 0)

            return metadata

        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}")
            return {}

# Global instance
audio_service = AudioProcessingService()
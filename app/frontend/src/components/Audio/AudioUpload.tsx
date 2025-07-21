// app/frontend/src/components/AudioUpload.tsx
// @ts-ignore
import React, { useState, useRef, useCallback } from 'react';

interface Song {
    id: number;
    title: string;
    artist: string;
    album: string;
    file_path?: string;
}

interface AudioUploadProps {
    onUploadSuccess?: (song: Song) => void;
    onUploadError?: (error: string) => void;
}

export default function AudioUpload({ onUploadSuccess, onUploadError }: AudioUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // Form state for manual metadata
    const [title, setTitle] = useState<string>('');
    const [artist, setArtist] = useState<string>('');
    const [album, setAlbum] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedArtwork, setSelectedArtwork] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const artworkInputRef = useRef<HTMLInputElement>(null);

    // Allowed file types
    const allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/ogg', 'audio/mp4'];
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/pjpeg', ''];

    const validateFile = (file: File, allowedTypes: string[]): boolean => {
        return allowedTypes.includes(file.type) ||
               allowedTypes.some(type => file.name.toLowerCase().endsWith(type.split('/')[1]));
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files: File[] = Array.from(e.dataTransfer.files);
        const audioFile: File | undefined = files.find((file: File) => validateFile(file, allowedAudioTypes));

        if (audioFile) {
            setSelectedFile(audioFile);
            setShowModal(true);
        } else {
            onUploadError?.('Please select a valid audio file (MP3, WAV, FLAC, M4A, OGG)');
        }
    }, [onUploadError, allowedAudioTypes]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file: File = files[0];
            if (validateFile(file, allowedAudioTypes)) {
                setSelectedFile(file);
                setShowModal(true);
            } else {
                onUploadError?.('Please select a valid audio file');
            }
        }
    };

    const handleArtworkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file: File = files[0];
            if (validateFile(file, allowedImageTypes)) {
                setSelectedArtwork(file);
            } else {
                onUploadError?.('Please select a valid image file');
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            if (selectedArtwork) {
                formData.append('artwork', selectedArtwork);
            }

            if (title.trim()) formData.append('title', title.trim());
            if (artist.trim()) formData.append('artist', artist.trim());
            if (album.trim()) formData.append('album', album.trim());

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch('http://localhost:8002/api/songs/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            const uploadedSong = await response.json();
            onUploadSuccess?.(uploadedSong);

            // Reset form
            setSelectedFile(null);
            setSelectedArtwork(null);
            setTitle('');
            setArtist('');
            setAlbum('');
            setShowModal(false);

        } catch (error: any) {
            onUploadError?.(error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const resetModal = () => {
        setSelectedFile(null);
        setSelectedArtwork(null);
        setTitle('');
        setArtist('');
        setAlbum('');
        setShowModal(false);
    };

    return (
        <>
            {/* Upload Button/Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    background: isDragging
                        ? "linear-gradient(135deg, #404040 0%, #505050 100%)"
                        : "linear-gradient(135deg, #282828 0%, #383838 100%)",
                    borderRadius: "16px",
                    padding: "2rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    border: isDragging ? "2px dashed #1DB954" : "2px dashed transparent"
                }}
                onMouseEnter={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 20px 40px rgba(40, 40, 40, 0.3)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                    }
                }}
            >
                <div style={{
                    fontSize: "2.5rem",
                    marginBottom: "1rem"
                }}>
                    {isDragging ? "📂" : "🎵"}
                </div>
                <h3 style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    margin: "0 0 0.5rem 0",
                    color: "#FFFFFF"
                }}>
                    {isDragging ? "Drop your audio file here" : "Upload Music"}
                </h3>
                <p style={{
                    color: "#B3B3B3",
                    marginBottom: "1rem",
                    fontSize: "0.9rem"
                }}>
                    {isDragging
                        ? "Release to select file"
                        : "Drag & drop audio files or click to browse"
                    }
                </p>
                <p style={{
                    color: "#727272",
                    fontSize: "0.75rem",
                    margin: 0
                }}>
                    Supports MP3, WAV, FLAC, M4A, OGG (max 50MB)
                </p>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.flac,.m4a,.ogg,.mp4"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Upload Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: '#181818',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '1.5rem',
                            color: '#FFFFFF'
                        }}>
                            Upload Audio File
                        </h2>

                        {/* File info */}
                        <div style={{
                            backgroundColor: '#282828',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <div style={{
                                    fontSize: '1.5rem'
                                }}>🎵</div>
                                <div>
                                    <div style={{
                                        fontWeight: '500',
                                        color: '#FFFFFF',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {selectedFile?.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: '#B3B3B3'
                                    }}>
                                        {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata form */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    color: '#FFFFFF',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    Title (optional)
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Song title"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#2A2A2A',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        color: '#FFFFFF',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    color: '#FFFFFF',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    Artist (optional)
                                </label>
                                <input
                                    type="text"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    placeholder="Artist name"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#2A2A2A',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        color: '#FFFFFF',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    color: '#FFFFFF',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    Album (optional)
                                </label>
                                <input
                                    type="text"
                                    value={album}
                                    onChange={(e) => setAlbum(e.target.value)}
                                    placeholder="Album name"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#2A2A2A',
                                        border: '1px solid #404040',
                                        borderRadius: '8px',
                                        color: '#FFFFFF',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Artwork upload */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    color: '#FFFFFF',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    Album Artwork (optional)
                                </label>
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => artworkInputRef.current?.click()}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#404040',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#FFFFFF',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        Choose Image
                                    </button>
                                    {selectedArtwork && (
                                        <span style={{
                                            fontSize: '0.875rem',
                                            color: '#B3B3B3'
                                        }}>
                                            {selectedArtwork.name}
                                        </span>
                                    )}
                                </div>
                                <input
                                    ref={artworkInputRef}
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.gif,.webp"
                                    onChange={handleArtworkSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Upload progress */}
                        {isUploading && (
                            <div style={{
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem'
                                }}>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: '#FFFFFF'
                                    }}>
                                        Uploading...
                                    </span>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: '#1DB954'
                                    }}>
                                        {uploadProgress}%
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: '#404040',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${uploadProgress}%`,
                                        height: '100%',
                                        backgroundColor: '#1DB954',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={resetModal}
                                disabled={isUploading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#404040',
                                    border: 'none',
                                    borderRadius: '50px',
                                    color: '#FFFFFF',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    opacity: isUploading ? 0.5 : 1
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: (!selectedFile || isUploading)
                                        ? '#404040'
                                        : 'linear-gradient(45deg, #1DB954, #1ed760)',
                                    border: 'none',
                                    borderRadius: '50px',
                                    color: '#FFFFFF',
                                    cursor: (!selectedFile || isUploading) ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}
                            >
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
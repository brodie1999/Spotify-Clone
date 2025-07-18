from typing import List, Optional

from pydantic import EmailStr
from sqlmodel import Field, SQLModel, Relationship


class LikedSongLink(SQLModel, table=True):
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", primary_key=True)
    song_id: Optional[int] = Field(default=None, foreign_key="song.id", primary_key=True)

class PlaylistSongLink(SQLModel, table=True):
    playlist_id : Optional[int] = Field(
        default=None,
        foreign_key="playlist.id",
        primary_key=True,
    )
    song_id : Optional[int] = Field(
        default=None,
        foreign_key="song.id",
        primary_key=True,
    )

# Song models
class SongBase(SQLModel):
    title : str = Field(index=True)
    artist : str = Field(index=True)
    album : str = Field(index=True)

class Song(SongBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    artwork_path: Optional[str] = Field(default=None)
    uploaded_by: Optional[int] = Field(default=None, foreign_key="user.id")

    # Audio analysis field
    tempo: Optional[float] = Field(default=None)
    musical_key: Optional[str] = Field(default=None)
    genre: Optional[str] = Field(default=None)
    mood: Optional[str] = Field(default=None)
    energy: Optional[float] = Field(default=None)
    danceability: Optional[float] = Field(default=None)
    duration: Optional[float] = Field(default=None)

    playlists: List["Playlist"] = Relationship(back_populates="songs", link_model=PlaylistSongLink)
    liked_by: List["User"] = Relationship(back_populates="liked_songs", link_model=LikedSongLink)

# Playlist Models
class PlaylistBase(SQLModel):
    name: str = Field(index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    is_liked_songs: bool = Field(default=False, sa_column_kwargs={"server_default": "False"})

class Playlist(PlaylistBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    songs: List[Song] = Relationship(back_populates="playlists", link_model=PlaylistSongLink)
    user: Optional["User"] = Relationship(back_populates="playlists")

# User Models
class UserBase(SQLModel):
    username: str = Field(index=True, unique=True)
    password: str = Field(index=True)
    email: EmailStr = Field(index=True)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    playlists: List["Playlist"] = Relationship(back_populates="user")
    liked_songs: List["Song"] = Relationship(back_populates="liked_by", link_model=LikedSongLink)
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
    playlists: List["Playlist"] = Relationship(back_populates="songs", link_model=PlaylistSongLink)
    liked_by: List["User"] = Relationship(back_populates="liked_songs", link_model=LikedSongLink)

# Playlist Models
class PlaylistBase(SQLModel):
    name: str = Field(index=True, unique=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)

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
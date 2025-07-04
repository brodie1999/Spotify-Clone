from typing import List, Optional
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlmodel import create_engine, SQLModel, Field, Relationship

from passlib.context import CryptContext

# Base classes
class SongBase(SQLModel):
    title : str
    artist : str
    album : str

class PlaylistBase(SQLModel):
    name : str
    user_id : Optional[int] = Field(default=None, foreign_key="user.id")

class UserBase(SQLModel):
    username : str
    password : str
    email : str

## Association table for many-to-many Playlist + song
class PlaylistSongLink(SQLModel, table=True):
    playlist_id : Optional[int] = Field(
        default=None,
        sa_column=Column("playlist_id", Integer, ForeignKey("playlist.id"), primary_key=True)
    )
    song_id : Optional[int] = Field(
        default=None,
        sa_column=Column("song.id", Integer, ForeignKey("song.id"), primary_key=True)
    )

## Playlist table, with PK + real FK + relationship
class Playlist(PlaylistBase, table=True):
    id : Optional[int] = Field(default=None, sa_column=Column("id", Integer, primary_key=True))
    name : str = Field(sa_column=Column("name", String(50), unique=True, nullable=False, index=True))
    user_id : int = Field(sa_column=Column("user_id", Integer, ForeignKey("user.id"), nullable=False, index=True))
    songs : List[SongBase] = Relationship(back_populates="songs", link_model=PlaylistSongLink)

## User table, with PK + fields via sa_column
class User(UserBase, table=True):
    id : Optional[int] = Field(
        default=None,
        sa_column=Column("id", Integer, primary_key=True, index=False)
    )

    username : str = Field(
        sa_column=Column("username", String(50), unique=True, nullable=False, index=True)
    )
    email : str = Field(
        sa_column=Column("email", String(120), unique=True, nullable=False, index=True)
    )

    password : str = Field(
        sa_column=Column("password", String(120), nullable=False, index=True)
    )

    spotify_token : str = Field(
        sa_column=Column("spotify_token", String, nullable=False, index=True)
    )

    playlists : List[Playlist] = Relationship(back_populates="user")

class Song(SongBase, table=True):
    id : Optional[int] = Field(default=None, sa_column=Column("id", Integer, primary_key=True))

    playlists : List[Playlist] = Relationship(back_populates="songs", link_model=PlaylistSongLink)
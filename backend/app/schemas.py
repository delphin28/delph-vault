from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class CategoryResponse(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class PasswordCreate(BaseModel):
    name: str = Field(min_length=1, max_length=15)
    url: Optional[str] = Field(default=None, max_length=100)
    password: str = Field(min_length=1, max_length=256)
    category_id: int


class PasswordUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=15)
    url: Optional[str] = Field(default=None, max_length=100)
    password: Optional[str] = Field(default=None, min_length=1, max_length=256)
    category_id: Optional[int] = None


class PasswordResponse(BaseModel):
    id: int
    name: str
    url: Optional[str]
    password: str
    category_id: int

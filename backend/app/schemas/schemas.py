from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str
    role_code: str
    company_id: Optional[int] = None
    employee_id: Optional[int] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    roles: List[str] = []
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class VisitorCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    mobile_number: str
    company_name: Optional[str] = None
    designation: Optional[str] = None
    id_doc_type: Optional[str] = None
    masked_id_number: Optional[str] = None

class VisitPreRegisterRequest(BaseModel):
    visitor: VisitorCreate
    company_id: int
    location_id: int
    building_id: int
    department_id: int
    host_employee_id: int
    category_id: int
    purpose_id: int
    scheduled_arrival: datetime
    scheduled_departure: datetime
    accompanying_count: int = 0
    vehicle_registration: Optional[str] = None
    material_description: Optional[str] = None
    nda_accepted: bool = False
    safety_accepted: bool = False
    special_instructions: Optional[str] = None

class ApprovalActionRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")
    comments: Optional[str] = None

class GateScanRequest(BaseModel):
    qr_token: str
    gate_id: int
    idempotency_key: str
    notes: Optional[str] = None

class GeneratePassIdRequest(BaseModel):
    format_type: str = Field(default="YYMMDD", pattern="^(YYMMDD|DDMMYY|YYYYMMDD)$")
    custom_prefix: Optional[str] = "GP"

class GeneratedPassIdResponse(BaseModel):
    pass_id: str
    prefix: str
    date_key: str
    seq_number: int
    pad_length: int
    format: str

class ValidatePassIdRequest(BaseModel):
    pass_id: str

class ValidatePassIdResponse(BaseModel):
    is_valid: bool
    prefix: Optional[str] = None
    date_key: Optional[str] = None
    seq_number: Optional[int] = None
    error: Optional[str] = None

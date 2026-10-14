from sqlalchemy import (
    Column, BigInteger, String, Boolean, DateTime, ForeignKey, 
    Text, Integer, Numeric, JSON, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    tax_id = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    locations = relationship("Location", back_populates="company", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="company", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="company", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = "locations"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id = Column(BigInteger, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="United States", nullable=False)
    postal_code = Column(String(30), nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    company = relationship("Company", back_populates="locations")
    buildings = relationship("Building", back_populates="location", cascade="all, delete-orphan")

class Building(Base):
    __tablename__ = "buildings"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    location_id = Column(BigInteger, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    emergency_evacuation_point = Column(String(255), nullable=True)
    total_floors = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    location = relationship("Location", back_populates="buildings")
    floors = relationship("Floor", back_populates="building", cascade="all, delete-orphan")
    gates = relationship("Gate", back_populates="building", cascade="all, delete-orphan")

class Floor(Base):
    __tablename__ = "floors"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    building_id = Column(BigInteger, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    floor_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    access_level_required = Column(String(50), default="STANDARD", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    building = relationship("Building", back_populates="floors")

class Gate(Base):
    __tablename__ = "gates"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    building_id = Column(BigInteger, ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    gate_type = Column(String(50), default="BI_DIRECTIONAL", nullable=False)
    is_vehicle_accessible = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    building = relationship("Building", back_populates="gates")

class Department(Base):
    __tablename__ = "departments"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id = Column(BigInteger, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    cost_center = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    company = relationship("Company", back_populates="departments")
    employees = relationship("Employee", back_populates="department")

class Employee(Base):
    __tablename__ = "employees"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id = Column(BigInteger, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=False)
    employee_code = Column(String(50), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone_number = Column(String(50), nullable=False)
    designation = Column(String(150), nullable=False)
    can_host_visitors = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    company = relationship("Company", back_populates="employees")
    department = relationship("Department", back_populates="employees")

class Role(Base):
    __tablename__ = "roles"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_system_role = Column(Boolean, default=True, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id = Column(BigInteger, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    employee_id = Column(BigInteger, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    failed_login_attempts = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

class VisitorCategory(Base):
    __tablename__ = "visitor_categories"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    requires_nda = Column(Boolean, default=False)
    requires_safety_briefing = Column(Boolean, default=False)
    requires_host_escort = Column(Boolean, default=False)
    requires_dept_head_approval = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

class VisitPurpose(Base):
    __tablename__ = "visit_purposes"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    default_duration_hours = Column(Numeric(4, 2), default=2.0)
    is_active = Column(Boolean, default=True)

class Visitor(Base):
    __tablename__ = "visitors"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    visitor_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    mobile_number = Column(String(50), nullable=False)
    company_name = Column(String(255), nullable=True)
    designation = Column(String(150), nullable=True)
    id_doc_type = Column(String(50), nullable=True)
    masked_id_number = Column(String(50), nullable=True)
    is_blacklisted = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Visit(Base):
    __tablename__ = "visits"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    visit_number = Column(String(50), unique=True, nullable=False, index=True)
    visitor_id = Column(BigInteger, ForeignKey("visitors.id"), nullable=False)
    company_id = Column(BigInteger, ForeignKey("companies.id"), nullable=False)
    location_id = Column(BigInteger, ForeignKey("locations.id"), nullable=False)
    building_id = Column(BigInteger, ForeignKey("buildings.id"), nullable=False)
    department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=False)
    host_employee_id = Column(BigInteger, ForeignKey("employees.id"), nullable=False)
    category_id = Column(BigInteger, ForeignKey("visitor_categories.id"), nullable=False)
    purpose_id = Column(BigInteger, ForeignKey("visit_purposes.id"), nullable=False)
    visit_type = Column(String(50), default="PRE_REGISTERED")
    status = Column(String(50), default="PENDING_APPROVAL")
    scheduled_arrival = Column(DateTime, nullable=False)
    scheduled_departure = Column(DateTime, nullable=False)
    actual_arrival = Column(DateTime, nullable=True)
    actual_departure = Column(DateTime, nullable=True)
    accompanying_count = Column(Integer, default=0)
    nda_accepted = Column(Boolean, default=False)
    safety_accepted = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    visitor = relationship("Visitor")
    host = relationship("Employee")
    pass_record = relationship("VisitorPass", back_populates="visit", uselist=False)

class VisitorPass(Base):
    __tablename__ = "visitor_passes"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    visit_id = Column(BigInteger, ForeignKey("visits.id", ondelete="CASCADE"), unique=True, nullable=False)
    pass_number = Column(String(50), unique=True, nullable=False)
    qr_token = Column(String(255), unique=True, nullable=False, index=True)
    qr_signature = Column(String(255), nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    max_entries = Column(Integer, default=1)
    current_entries = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    visit = relationship("Visit", back_populates="pass_record")

class GateTransaction(Base):
    __tablename__ = "gate_transactions"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    pass_id = Column(BigInteger, ForeignKey("visitor_passes.id"), nullable=False)
    visit_id = Column(BigInteger, ForeignKey("visits.id"), nullable=False)
    gate_id = Column(BigInteger, ForeignKey("gates.id"), nullable=False)
    security_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    idempotency_key = Column(String(100), unique=True, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    notes = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_user_id = Column(BigInteger, nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    entity_name = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, server_default=func.now())

class DailyPassCounter(Base):
    __tablename__ = "daily_pass_counters"
    date_key = Column(String(10), primary_key=True, index=True)  # Format: YYMMDD e.g. '261014' or '141026'
    last_seq = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

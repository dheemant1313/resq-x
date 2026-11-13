from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class NodeType(str, Enum):
    CENTRAL_DEPOT = "CENTRAL_DEPOT"
    WAYPOINT = "WAYPOINT"
    RELIEF_CENTER = "RELIEF_CENTER"

class RouteStatus(str, Enum):
    PLANNED = "PLANNED"
    DISPATCHED = "DISPATCHED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"
    REROUTED = "REROUTED"
    CANCELLED = "CANCELLED"

class RoadNetworkNode(Base):
    __tablename__ = "road_network_nodes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    node_type = Column(SQLEnum(NodeType), default=NodeType.WAYPOINT, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, default=0.0)
    is_operational = Column(Boolean, default=True)

class RoadNetworkEdge(Base):
    __tablename__ = "road_network_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_node_id = Column(Integer, ForeignKey("road_network_nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id = Column(Integer, ForeignKey("road_network_nodes.id", ondelete="CASCADE"), nullable=False)
    
    distance_km = Column(Float, nullable=False)
    # Disaster conditions: multiplier applied to effective edge weight in Dijkstra calculation
    # e.g., 1.0 = clean tarmac; 1.5 = water-logging; 2.5 = severe debris; blocked if is_blocked is True
    condition_multiplier = Column(Float, default=1.0, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)
    risk_factor = Column(Float, default=1.0, nullable=False)  # 1.0 to 5.0 (hazard rating)
    road_name = Column(String(200), nullable=True)

    # Relationships
    source_node = relationship("RoadNetworkNode", foreign_keys=[source_node_id])
    target_node = relationship("RoadNetworkNode", foreign_keys=[target_node_id])

class DispatchRoute(Base):
    __tablename__ = "dispatch_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_code = Column(String(50), unique=True, index=True, nullable=False)
    request_id = Column(Integer, ForeignKey("resource_requests.id", ondelete="CASCADE"), nullable=False)
    
    vehicle_type = Column(String(100), default="Standard Relief Truck (5000 kg)", nullable=False)
    vehicle_capacity_kg = Column(Float, default=5000.0, nullable=False)
    
    origin_node_id = Column(Integer, ForeignKey("road_network_nodes.id"), nullable=False)
    destination_node_id = Column(Integer, ForeignKey("road_network_nodes.id"), nullable=False)
    
    total_distance_km = Column(Float, nullable=False)
    weighted_cost = Column(Float, nullable=False)
    estimated_duration_minutes = Column(Float, nullable=False)
    path_nodes = Column(JSON, nullable=False)  # Array of node objects [{code, name, lat, lng}, ...]
    
    status = Column(SQLEnum(RouteStatus), default=RouteStatus.PLANNED, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)

    # Relationships
    request = relationship("ResourceRequest", back_populates="routes")
    origin_node = relationship("RoadNetworkNode", foreign_keys=[origin_node_id])
    destination_node = relationship("RoadNetworkNode", foreign_keys=[destination_node_id])

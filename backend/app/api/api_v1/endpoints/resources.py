from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.inventory import ResourceItem, ResourceCategory, InventoryTransaction
from app.models.user import User
from app.schemas.inventory import (
    ResourceItemResponse,
    ResourceItemCreate,
    ResourceItemUpdate,
    RestockRequest,
    InventoryTransactionResponse,
    LowStockAlert
)
from app.api.deps import get_current_user, require_operator

router = APIRouter()

@router.get("/", response_model=List[ResourceItemResponse])
def get_available_resources(
    search: Optional[str] = Query(None),
    category: Optional[ResourceCategory] = Query(None),
    low_stock_only: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch all active emergency relief supplies and warehouse resources.
    Supports filtering by category, search by SKU/name, and low stock status.
    """
    query = db.query(ResourceItem)

    if category:
        query = query.filter(ResourceItem.category == category)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (ResourceItem.name.ilike(search_fmt)) |
            (ResourceItem.sku.ilike(search_fmt)) |
            (ResourceItem.storage_location.ilike(search_fmt))
        )

    if low_stock_only:
        query = query.filter(ResourceItem.available_stock <= 100)

    return query.order_by(ResourceItem.priority_score.desc()).all()

@router.post("/", response_model=ResourceItemResponse, status_code=status.HTTP_201_CREATED)
def create_resource_item(
    item_in: ResourceItemCreate,
    db: Session = Depends(get_db),
    operator: User = Depends(require_operator)
) -> Any:
    """
    Operator-only endpoint to add a new inventory resource SKU into Central Warehouse.
    """
    existing = db.query(ResourceItem).filter(ResourceItem.sku == item_in.sku.upper().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Resource with SKU '{item_in.sku}' already exists in warehouse inventory."
        )

    item_data = item_in.model_dump()
    item_data["sku"] = item_data["sku"].upper().strip()
    item_data["available_stock"] = item_data["total_stock"]
    item_data["reserved_stock"] = 0

    item = ResourceItem(**item_data)
    db.add(item)
    db.flush()

    # Record initial inventory transaction
    tx = InventoryTransaction(
        resource_id=item.id,
        operator_id=operator.id,
        transaction_type="RESTOCK",
        quantity=item.total_stock,
        previous_available=0,
        new_available=item.available_stock,
        notes="Initial stock intake upon SKU commissioning"
    )
    db.add(tx)

    db.commit()
    db.refresh(item)
    return item

@router.get("/alerts/low-stock", response_model=List[LowStockAlert])
def get_low_stock_alerts(
    threshold: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _operator: User = Depends(require_operator)
) -> Any:
    """
    Operator-only endpoint to fetch low-stock inventory alerts requiring immediate procurement.
    """
    items = db.query(ResourceItem).all()
    alerts = []
    for itm in items:
        # Check either absolute threshold or percentage < 25%
        percent = (itm.available_stock / itm.total_stock * 100) if itm.total_stock > 0 else 0
        if itm.available_stock <= threshold or percent <= 25.0:
            alerts.append(LowStockAlert(
                id=itm.id,
                sku=itm.sku,
                name=itm.name,
                category=itm.category,
                unit=itm.unit,
                storage_location=itm.storage_location,
                available_stock=itm.available_stock,
                total_stock=itm.total_stock,
                threshold=threshold,
                percent_available=round(percent, 1),
                is_critical=itm.available_stock <= (threshold // 2)
            ))
    return sorted(alerts, key=lambda a: a.available_stock)

@router.get("/history/transactions", response_model=List[InventoryTransactionResponse])
def get_inventory_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    resource_id: Optional[int] = Query(None),
    transaction_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _operator: User = Depends(require_operator)
) -> Any:
    """
    Operator-only endpoint to inspect complete inventory transaction and restocking logs.
    """
    query = db.query(InventoryTransaction)

    skip_val = skip if isinstance(skip, int) else 0
    limit_val = limit if isinstance(limit, int) else 100

    if resource_id and isinstance(resource_id, int):
        query = query.filter(InventoryTransaction.resource_id == resource_id)

    if transaction_type and isinstance(transaction_type, str):
        query = query.filter(InventoryTransaction.transaction_type == transaction_type.upper())

    txs = query.order_by(InventoryTransaction.created_at.desc()).offset(skip_val).limit(limit_val).all()

    results = []
    for tx in txs:
        results.append(InventoryTransactionResponse(
            id=tx.id,
            resource_id=tx.resource_id,
            resource_name=tx.resource.name if tx.resource else None,
            resource_sku=tx.resource.sku if tx.resource else None,
            operator_id=tx.operator_id,
            operator_username=tx.operator.username if tx.operator else "Central Depot Command",
            transaction_type=tx.transaction_type,
            quantity=tx.quantity,
            previous_available=tx.previous_available,
            new_available=tx.new_available,
            notes=tx.notes,
            created_at=tx.created_at
        ))
    return results

@router.get("/{resource_id}", response_model=ResourceItemResponse)
def get_resource_by_id(
    resource_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get detailed information for a specific resource item.
    """
    item = db.query(ResourceItem).filter(ResourceItem.id == resource_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource #{resource_id} not found."
        )
    return item

@router.put("/{resource_id}", response_model=ResourceItemResponse)
def update_resource_item(
    resource_id: int,
    item_in: ResourceItemUpdate,
    db: Session = Depends(get_db),
    _operator: User = Depends(require_operator)
) -> Any:
    """
    Operator-only endpoint to update resource item properties.
    """
    item = db.query(ResourceItem).filter(ResourceItem.id == resource_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource #{resource_id} not found."
        )

    if item_in.name is not None:
        item.name = item_in.name
    if item_in.category is not None:
        item.category = item_in.category
    if item_in.unit is not None:
        item.unit = item_in.unit
    if item_in.storage_location is not None:
        item.storage_location = item_in.storage_location
    if item_in.weight_per_unit_kg is not None:
        item.weight_per_unit_kg = item_in.weight_per_unit_kg
    if item_in.priority_score is not None:
        item.priority_score = item_in.priority_score

    db.commit()
    db.refresh(item)
    return item

@router.post("/{resource_id}/restock", response_model=ResourceItemResponse)
def restock_resource(
    resource_id: int,
    restock_in: RestockRequest,
    db: Session = Depends(get_db),
    operator: User = Depends(require_operator)
) -> Any:
    """
    Operator-only endpoint to record incoming relief shipments and restock inventory.
    Atomically updates total_stock and available_stock and records an audit log.
    """
    item = db.query(ResourceItem).filter(ResourceItem.id == resource_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource #{resource_id} not found in inventory."
        )

    prev_avail = item.available_stock
    item.total_stock += restock_in.quantity
    item.available_stock += restock_in.quantity
    new_avail = item.available_stock

    # Record inventory transaction
    tx = InventoryTransaction(
        resource_id=item.id,
        operator_id=operator.id,
        transaction_type="RESTOCK",
        quantity=restock_in.quantity,
        previous_available=prev_avail,
        new_available=new_avail,
        notes=restock_in.notes or f"Restocked {restock_in.quantity} {item.unit}"
    )
    db.add(tx)

    db.commit()
    db.refresh(item)
    return item

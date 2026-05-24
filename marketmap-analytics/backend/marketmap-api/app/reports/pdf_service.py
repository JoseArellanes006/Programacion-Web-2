"""
Servicio para generación de reportes PDF.

Usa ReportLab para generar archivos en memoria.

Instalación:
pip install reportlab
"""

from datetime import datetime
from io import BytesIO
from typing import Any

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def format_money(value: Any) -> str:
    """
    Formatea valores monetarios.
    """
    try:
        return f"${float(value):,.2f}"
    except (TypeError, ValueError):
        return "$0.00"


def format_datetime(value: Any) -> str:
    """
    Formatea fechas para impresión simple en PDF.
    """
    if isinstance(value, datetime):
        return value.isoformat()

    if value is None:
        return ""

    return str(value)


def write_header(
    pdf: canvas.Canvas,
    title: str,
    y: int
) -> int:
    """
    Escribe encabezado del reporte.
    """
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, title)

    y -= 25

    pdf.setFont("Helvetica", 9)
    pdf.drawString(
        40,
        y,
        "MarketMap Analytics - Reporte generado desde el backend"
    )

    y -= 30

    return y


def write_section_title(
    pdf: canvas.Canvas,
    title: str,
    y: int
) -> int:
    """
    Escribe título de sección.
    """
    if y < 80:
        pdf.showPage()
        y = 750

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, title)

    return y - 18


def write_line(
    pdf: canvas.Canvas,
    text: str,
    y: int
) -> int:
    """
    Escribe una línea de texto.
    """
    if y < 60:
        pdf.showPage()
        y = 750

    pdf.setFont("Helvetica", 9)
    pdf.drawString(40, y, text[:115])

    return y - 14


def build_sales_pdf(data: dict[str, Any]) -> bytes:
    """
    Genera PDF de ventas.
    """
    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=letter
    )

    y = 750

    y = write_header(
        pdf,
        "Reporte de ventas",
        y
    )

    kpis = data.get("kpis", {})

    y = write_section_title(
        pdf,
        "KPI generales",
        y
    )

    y = write_line(pdf, f"Ventas totales: {format_money(kpis.get('totalSales', 0))}", y)
    y = write_line(pdf, f"Pedidos totales: {kpis.get('totalOrders', 0)}", y)
    y = write_line(pdf, f"Productos vendidos: {kpis.get('totalProducts', 0)}", y)
    y = write_line(pdf, f"Clientes totales: {kpis.get('totalCustomers', 0)}", y)
    y = write_line(pdf, f"Ticket promedio: {format_money(kpis.get('averageTicket', 0))}", y)
    y = write_line(pdf, f"Pedidos pendientes: {kpis.get('pendingOrders', 0)}", y)
    y = write_line(pdf, f"Pedidos pagados: {kpis.get('paidOrders', 0)}", y)
    y = write_line(pdf, f"Pedidos cancelados: {kpis.get('cancelledOrders', 0)}", y)
    y = write_line(pdf, f"Pedidos entregados: {kpis.get('deliveredOrders', 0)}", y)

    y -= 10

    y = write_section_title(
        pdf,
        "Ventas por fecha",
        y
    )

    sales_summary = data.get("salesSummary", [])

    if not sales_summary:
        y = write_line(pdf, "No hay ventas para mostrar.", y)

    for item in sales_summary:
        y = write_line(
            pdf,
            f"{item.get('date')} | Ventas: {format_money(item.get('totalSales', 0))} | Pedidos: {item.get('totalOrders', 0)}",
            y
        )

    y -= 10

    y = write_section_title(
        pdf,
        "Productos más vendidos",
        y
    )

    top_products = data.get("topProducts", [])

    if not top_products:
        y = write_line(pdf, "No hay productos vendidos para mostrar.", y)

    for item in top_products:
        y = write_line(
            pdf,
            f"{item.get('productName')} | Categoría: {item.get('category')} | Cantidad: {item.get('totalQuantity', 0)} | Total: {format_money(item.get('totalSales', 0))}",
            y
        )

    y -= 10

    y = write_section_title(
        pdf,
        "Ventas por categoría",
        y
    )

    sales_by_category = data.get("salesByCategory", [])

    if not sales_by_category:
        y = write_line(pdf, "No hay categorías para mostrar.", y)

    for item in sales_by_category:
        y = write_line(
            pdf,
            f"{item.get('category')} | Ventas: {format_money(item.get('totalSales', 0))} | Cantidad: {item.get('totalQuantity', 0)}",
            y
        )

    pdf.save()

    buffer.seek(0)

    return buffer.getvalue()


def build_products_pdf(data: dict[str, Any]) -> bytes:
    """
    Genera PDF de productos.
    """
    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=letter
    )

    y = 750

    y = write_header(
        pdf,
        "Reporte de productos",
        y
    )

    y = write_section_title(
        pdf,
        "Listado de productos",
        y
    )

    products = data.get("products", [])

    if not products:
        y = write_line(
            pdf,
            "No hay productos para mostrar.",
            y
        )

    for product in products:
        y = write_line(
            pdf,
            f"{product.get('name')} | Categoría: {product.get('category')} | Precio: {format_money(product.get('price', 0))} | Stock: {product.get('stock', 0)} | Estado: {product.get('status')}",
            y
        )

    pdf.save()

    buffer.seek(0)

    return buffer.getvalue()


def build_orders_pdf(data: dict[str, Any]) -> bytes:
    """
    Genera PDF de pedidos.
    """
    buffer = BytesIO()

    pdf = canvas.Canvas(
        buffer,
        pagesize=letter
    )

    y = 750

    y = write_header(
        pdf,
        "Reporte de pedidos",
        y
    )

    y = write_section_title(
        pdf,
        "Listado de pedidos",
        y
    )

    orders = data.get("orders", [])

    if not orders:
        y = write_line(
            pdf,
            "No hay pedidos para mostrar.",
            y
        )

    for order in orders:
        y = write_line(
            pdf,
            f"{order.get('folio')} | Cliente: {order.get('customerName')} | Estado: {order.get('status')} | Pago: {order.get('paymentMethod')} | Total: {format_money(order.get('total', 0))}",
            y
        )

        details = order.get("details", [])

        for detail in details:
            y = write_line(
                pdf,
                f"  - {detail.get('productName')} | Cantidad: {detail.get('quantity', 0)} | Subtotal: {format_money(detail.get('subtotal', 0))}",
                y
            )

    pdf.save()

    buffer.seek(0)

    return buffer.getvalue()
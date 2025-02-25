const socket = io("http://localhost:3000");

document.addEventListener("DOMContentLoaded", () => {
    loadOrders(); // Fetch orders when page loads
});

async function loadOrders() {
    const response = await fetch("http://localhost:3000/getOrders");
    const orders = await response.json();
    const tableBody = document.getElementById("orderTableBody");

    tableBody.innerHTML = ""; // Clear previous data

    orders.forEach(order => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.userId}</td>
            <td>₹${order.totalAmount}</td>
            <td>${order.orderStatus}</td>
            <td>
                <select id="status-${order.orderId}">
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                </select>
                <button onclick="updateOrderStatus('${order.orderId}')">Update</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function updateOrderStatus(orderId) {
    const newStatus = document.getElementById(`status-${orderId}`).value;

    const response = await fetch("http://localhost:3000/updateOrderStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus })
    });

    const result = await response.json();
    if (result.success) {
        alert("Order status updated!");
    } else {
        alert("Error updating order status");
    }
}

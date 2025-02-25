const socket = io("http://localhost:3000");

socket.on("orderStatusUpdated", ({ orderId, newStatus }) => {
    const statusContainer = document.getElementById("status-list");
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div class="status-item">
                <span>Order Status:</span>
                <span>${newStatus}</span>
            </div>
        `;
    }
});


function fetchMessages(ticketId) {
  fetch(`/tickets/get_messages/${ticketId}`)
    .then(response => response.json())
    .then(data => {
      const messagesDiv = document.getElementById('messages');
      messagesDiv.innerHTML = '';
      data.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.innerHTML = `
          <strong class="text-primary">${message.user}:</strong>
          <p>${message.message}</p>
          <span class="text-secondary">${message.created_at}</span>
        `;
        messagesDiv.appendChild(messageDiv);
      });
    });
}

function startFetchingMessages(ticketId) {
  setInterval(() => fetchMessages(ticketId), 3000); // Fetch messages every 3 seconds
}
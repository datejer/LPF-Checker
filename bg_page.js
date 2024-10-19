// Request queue from chatgpt so we don't accidentally ddos steam

// Initialize an empty queue to store pending requests
const requestQueue = [];
// Variable to track if a request is currently being processed
let isProcessing = false;

// Function to process requests from the queue
async function processQueue() {
  // If a request is already being processed or there are no pending requests, return
  if (isProcessing || requestQueue.length === 0) return;

  // Set the flag to indicate that a request is being processed
  isProcessing = true;

  // Dequeue the first request from the queue
  const request = requestQueue.shift();

  try {
    // Perform the fetch operation
    const response = await fetch(request.url, {
      redirect: "manual",
      cache: "no-store",
    });
    const responseText = await response.text();

    // Call the onSuccess callback with the response
    request.onSuccess(responseText);
  } catch (error) {
    console.error("Error processing request:", error);
  } finally {
    // Set the flag to indicate that request processing is complete
    isProcessing = false;

    // Process the next request in the queue
    processQueue();
  }
}

// Listener for incoming messages
chrome.runtime.onMessage.addListener(function (url, sender, onSuccess) {
  // Add the request to the queue
  requestQueue.push({ url, onSuccess });

  // If no request is currently being processed, start processing the queue
  if (!isProcessing) {
    processQueue();
  }

  return true; // Will respond asynchronously.
});

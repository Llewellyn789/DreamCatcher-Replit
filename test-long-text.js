
// Test script to verify text clamping
const testLongText = {
  snippet: "This is an extremely long dream snippet that should definitely exceed the 80 character limit and get clamped properly to prevent overflow issues in the OG card generation. This text keeps going and going to ensure we test the edge case properly.",
  archetype: "The Sage with an Extremely Long Name That Should Also Be Handled Gracefully",
  guidance: "take a very long journey through the depths of your unconscious mind and explore all the hidden meanings and symbols that might be present in your dreams"
};

console.log("Snippet length:", testLongText.snippet.length);
console.log("Clamped snippet:", testLongText.snippet.length > 80 ? testLongText.snippet.substring(0, 77) + "..." : testLongText.snippet);

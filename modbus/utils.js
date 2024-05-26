function createMQTTMessage(value, quality, timestamp) {
    return { Value: value, Quality: quality, Timestamp: timestamp };
  }
  
  module.exports = { createMQTTMessage };
  
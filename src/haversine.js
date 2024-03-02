// Function to calculate the distance between two coordinates using the Haversine formula
function calculateDistance(lon1, lat1, lon2, lat2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180; // Difference in latitude
    const dLon = (lon2 - lon1) * Math.PI / 180; // Difference in longitude
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

// Example usage:
// const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
// console.log("Distance:", distance, "km");

module.exports = calculateDistance;

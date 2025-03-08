// Remove the DestinationIndicator component definition
// Remove this entire block:
const DestinationIndicator = () => (
  <View style={styles.destinationIndicator}>
    // ...component content...
  </View>
);

// Remove it from the return statement
// Change this:
return (
  <View style={styles.container}>
    {/* ...other components... */}
    <DriverOnWayModal />
    <StartRideModal />
    <ChatModal />
    <CarCategoriesModal />
    <Notification />
    {/* Remove this line: */}
    {/* {rideInProgress && <DestinationIndicator />} */}
  </View>
);

// Remove these styles from StyleSheet.create:
const styles = StyleSheet.create({
  // ...other styles...
  
  // Remove these style blocks:
  // destinationIndicator: { ... },
  // destinationTitle: { ... },
  // arrowContainer: { ... },
  // arrowLine: { ... },
  // gradientLine: { ... },
  // bounceArrow: { ... },
  // destinationAddress: { ... },
});
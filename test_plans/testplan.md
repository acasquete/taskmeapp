# Test Plan Summary

## Test Cases

### 1. Disallow BoardID Loading Without Shared Attribute Set to True
- **Goal**: To verify that the system prevents the loading of a BoardID unless its "shared" attribute is explicitly set to true.
- **Expected Outcome**: The system rejects the attempt to load a BoardID with "shared" = false, displaying an error or rejection message.

### 2. Owner Must Listen to Events Upon Sharing
- **Goal**: Ensure that the board owner begins to receive all relevant events, updates, or interactions made to the board once it is shared.
- **Expected Outcome**: The owner successfully receives notifications or updates for actions performed on the shared board.

### 3. Stop Receiving Events When Switching Dashboards
- **Goal**: Confirm that users stop receiving events from a previously active dashboard after switching to another dashboard.
- **Expected Outcome**: No events from the old dashboard are received after the switch.

### 4. Any User Can Delete Everything
- **Goal**: Test the ability of any user with access to delete all contents of a board.
- **Expected Outcome**: The board is cleared of all contents successfully, regardless of the user's role.

### 5. Event Listening Persists After Deletion
- **Goal**: Ensure that the system continues to listen for and communicate events or changes to the board even after all its contents have been deleted.
- **Expected Outcome**: New events or changes are still communicated post-deletion.


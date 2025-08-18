// import * as signalR from '@microsoft/signalr';

// class SignalRService {
//   constructor() {
//     if (SignalRService.instance) {
//       return SignalRService.instance;
//     }

//     this.connection = new signalR.HubConnectionBuilder()
//       .withUrl('https://localhost:5000/notification-hub', {
//         accessTokenFactory: () => {
//           const token = localStorage.getItem('token');
//           return token;
//         },
//       })
//       .withAutomaticReconnect([0, 2000, 10000, 30000])
//       .configureLogging(signalR.LogLevel.None)
//       .build();

//     // Setup connection event handlers with silent handling
//     this.connection.onclose((error) => {
//       // Silent handling of connection close
//     });

//     this.connection.onreconnecting((error) => {
//       // Silent handling of reconnecting
//     });

//     this.connection.onreconnected((connectionId) => {
//       // Silent handling of reconnected
//     });

//     // Track active groups and callbacks with unique IDs
//     this.activeGroups = new Set();
//     this.commentCallbacks = new Map(); // Use Map with unique IDs
//     this.statusCallbacks = new Map();
//     this.callbackIdCounter = 0;
//     this.isEventHandlersSetup = false;
    
//     SignalRService.instance = this;
//   }

//   async start() {
//     if (this.connection.state === signalR.HubConnectionState.Connected) {
//       return Promise.resolve();
//     }

//     if (this.connection.state === signalR.HubConnectionState.Connecting) {
//       return new Promise((resolve) => {
//         const checkConnection = () => {
//           if (this.connection.state === signalR.HubConnectionState.Connected) {
//             resolve();
//           } else {
//             setTimeout(checkConnection, 100);
//           }
//         };
//         checkConnection();
//       });
//     }

//     try {
//       await this.connection.start();
//     } catch (err) {
//       // Silent retry after 5 seconds
//       setTimeout(() => this.start(), 5000);
//       throw err;
//     }
//   }

//   onReceiveComment(callback) {
//     // Generate unique ID for this callback
//     const callbackId = ++this.callbackIdCounter;
//     this.commentCallbacks.set(callbackId, callback);
    
//     // Setup event handler only once
//     if (!this.isEventHandlersSetup) {
//       this.connection.on('ReceiveComment', (comment) => {
//         // Call all registered callbacks
//         this.commentCallbacks.forEach(cb => {
//           try {
//             cb(comment);
//           } catch (error) {
//             // Silent error handling
//           }
//         });
//       });

//       this.connection.on('StatusUpdate', (updatedReport) => {
//         // Call all registered callbacks
//         this.statusCallbacks.forEach(cb => {
//           try {
//             cb(updatedReport);
//           } catch (error) {
//             // Silent error handling
//           }
//         });
//       });

//       this.isEventHandlersSetup = true;
//     }
    
//     return callbackId; // Return ID for cleanup
//   }

//   onStatusUpdate(callback) {
//     // Generate unique ID for this callback
//     const callbackId = ++this.callbackIdCounter;
//     this.statusCallbacks.set(callbackId, callback);
    
//     // Event handler is already setup in onReceiveComment
//     return callbackId; // Return ID for cleanup
//   }

//   // Method to remove callbacks when component unmounts
//   removeCommentCallback(callbackId) {
//     this.commentCallbacks.delete(callbackId);
//   }

//   removeStatusCallback(callbackId) {
//     this.statusCallbacks.delete(callbackId);
//   }

//   async joinReportGroup(reportId) {
//     if (this.activeGroups.has(reportId)) {
//       return;
//     }

//     try {
//       if (this.connection.state === signalR.HubConnectionState.Connected) {
//         await this.connection.invoke('JoinReportGroup', reportId);
//         this.activeGroups.add(reportId);
//       }
//     } catch (err) {
//       // Silent handling
//     }
//   }

//   async leaveReportGroup(reportId) {
//     if (!this.activeGroups.has(reportId)) {
//       return;
//     }

//     try {
//       if (this.connection.state === signalR.HubConnectionState.Connected) {
//         await this.connection.invoke('LeaveReportGroup', reportId);
//         this.activeGroups.delete(reportId);
//       }
//     } catch (err) {
//       // Silent handling
//     }
//   }

//   async stop() {
//     try {
//       // Leave all active groups before stopping
//       const leavePromises = Array.from(this.activeGroups).map(groupId => 
//         this.leaveReportGroup(groupId)
//       );
//       await Promise.all(leavePromises);
      
//       // Clear callbacks
//       this.commentCallbacks.clear();
//       this.statusCallbacks.clear();
      
//       if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
//         await this.connection.stop();
//       }
      
//       this.activeGroups.clear();
//       this.isEventHandlersSetup = false;
//     } catch (err) {
//       // Silent handling
//     }
//   }

//   // Static method to get instance
//   static getInstance() {
//     if (!SignalRService.instance) {
//       new SignalRService();
//     }
//     return SignalRService.instance;
//   }

//   // Static method to cleanup instance
//   static async cleanup() {
//     if (SignalRService.instance) {
//       await SignalRService.instance.stop();
//       SignalRService.instance = null;
//     }
//   }
// }

// export default SignalRService;

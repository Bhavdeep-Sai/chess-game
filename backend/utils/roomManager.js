const Game = require('../models/Game');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.cleanupInterval = null;
    this.INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    this.WAITING_TIMEOUT = 10 * 60 * 1000; // 10 minutes for waiting rooms
  }

  init() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000); // Check every 5 minutes

    console.log('Room manager initialized');
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Track room activity
  updateRoomActivity(roomId) {
    this.rooms.set(roomId, {
      lastActivity: Date.now(),
      roomId
    });
  }

  // Remove room from tracking
  removeRoom(roomId) {
    this.rooms.delete(roomId);
  }

  // Cleanup inactive rooms
  async cleanupInactiveRooms() {
    try {
      console.log('Starting room cleanup...');
      const now = Date.now();
      
      // Get all games from database
      const games = await Game.find({
        gameStatus: { $in: ['waiting', 'active'] }
      });

      for (const game of games) {
        const roomData = this.rooms.get(game.roomId);
        const lastActivity = roomData ? roomData.lastActivity : game.updatedAt.getTime();
        const timeSinceActivity = now - lastActivity;
        
        const shouldCleanup = 
          (game.gameStatus === 'waiting' && timeSinceActivity > this.WAITING_TIMEOUT) ||
          (game.gameStatus === 'active' && timeSinceActivity > this.INACTIVE_TIMEOUT);

        if (shouldCleanup) {
          console.log(`Cleaning up inactive room: ${game.roomId} (status: ${game.gameStatus}, inactive for: ${Math.round(timeSinceActivity / 60000)} minutes)`);
          
          if (game.gameStatus === 'waiting') {
            // Delete waiting rooms that are inactive
            await Game.deleteOne({ _id: game._id });
          } else if (game.gameStatus === 'active') {
            // Mark active games as abandoned
            game.gameStatus = 'finished';
            game.endedAt = new Date();
            game.result = {
              winner: 'draw',
              reason: 'timeout'
            };
            
            // Add system message
            game.chat.push({
              username: 'System',
              message: 'Game ended due to inactivity.',
              isSystem: true,
              timestamp: new Date()
            });
            
            await game.save();
          }
          
          this.removeRoom(game.roomId);
        }
      }

      // Also cleanup rooms that exist in memory but not in database
      for (const [roomId, roomData] of this.rooms.entries()) {
        const gameExists = games.some(g => g.roomId === roomId);
        if (!gameExists) {
          console.log(`Removing orphaned room from memory: ${roomId}`);
          this.removeRoom(roomId);
        }
      }

      console.log('Room cleanup completed');
    } catch (error) {
      console.error('Room cleanup error:', error);
    }
  }

  // Get room statistics
  getRoomStats() {
    return {
      trackedRooms: this.rooms.size,
      rooms: Array.from(this.rooms.values())
    };
  }

  // Force cleanup of specific room
  async forceCleanupRoom(roomId) {
    try {
      const game = await Game.findOne({ roomId });
      if (game) {
        if (game.gameStatus === 'waiting') {
          await Game.deleteOne({ roomId });
        } else {
          game.gameStatus = 'finished';
          game.endedAt = new Date();
          game.result = {
            winner: 'draw',
            reason: 'abandoned'
          };
          await game.save();
        }
      }
      this.removeRoom(roomId);
      console.log(`Force cleaned up room: ${roomId}`);
    } catch (error) {
      console.error(`Error force cleaning room ${roomId}:`, error);
    }
  }
}

// Create singleton instance
const roomManager = new RoomManager();

module.exports = roomManager;

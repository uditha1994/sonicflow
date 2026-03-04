"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarController = void 0;
const vscode = __importStar(require("vscode"));
const Constants_1 = require("../utils/Constants");
/**
 * Status bar music controller - always visible at the bottom of VS Code.
 * Shows current track info and provides quick controls.
 */
class StatusBarController {
    constructor() {
        // Create status bar items (right to left ordering with priority)
        const basePriority = Constants_1.CONSTANTS.STATUSBAR_PRIORITY;
        this.vibeIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 5);
        this.vibeIndicator.command = 'sonicflow.toggleVibeMode';
        this.vibeIndicator.tooltip = 'Toggle Vibe Mode';
        this.volumeIndicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 4);
        this.volumeIndicator.command = 'sonicflow.setVolume';
        this.nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 3);
        this.nextButton.text = '$(chevron-right)';
        this.nextButton.command = 'sonicflow.next';
        this.nextButton.tooltip = 'Next Track';
        this.playPauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 2);
        this.playPauseButton.command = 'sonicflow.playPause';
        this.prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority + 1);
        this.prevButton.text = '$(chevron-left)';
        this.prevButton.command = 'sonicflow.previous';
        this.prevButton.tooltip = 'Previous Track';
        this.trackInfo = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, basePriority);
        this.trackInfo.command = 'sonicflow.openPlayer';
        this.trackInfo.tooltip = 'Open SonicFlow Player';
        this.showInitialState();
    }
    /**
     * Update the status bar based on current player state
     */
    update(state) {
        if (state.currentTrack) {
            this.updateTrackInfo(state.currentTrack, state.position);
            this.updatePlayPauseButton(state.isPlaying);
            this.updateVibeIndicator(state.vibeMode);
            this.updateVolumeIndicator(state.volume);
            this.showAllItems();
        }
        else {
            this.showInitialState();
        }
    }
    updateTrackInfo(track, position) {
        const title = this.truncateText(track.title, Constants_1.CONSTANTS.TRACK_TITLE_MAX_LENGTH);
        const sourceIcon = track.source === 'youtube' ? '$(globe)' : '$(file-media)';
        const timeStr = this.formatTime(position);
        this.trackInfo.text = `${sourceIcon} ${title} - ${track.artist} [${timeStr}]`;
        this.trackInfo.tooltip = `${track.title}\nby ${track.artist}\n\nClick to open player`;
    }
    updatePlayPauseButton(isPlaying) {
        this.playPauseButton.text = isPlaying ? '$(debug-pause)' : '$(play)';
        this.playPauseButton.tooltip = isPlaying ? 'Pause' : 'Play';
    }
    updateVibeIndicator(vibeMode) {
        this.vibeIndicator.text = vibeMode ? '$(pulse) Vibe' : '$(pulse)';
        this.vibeIndicator.color = vibeMode ? '#00E5A0' : undefined;
        this.vibeIndicator.tooltip = vibeMode ? 'Vibe Mode: ON' : 'Vibe Mode: OFF';
    }
    updateVolumeIndicator(volume) {
        let icon = '$(unmute)';
        if (volume === 0) {
            icon = '$(mute)';
        }
        else if (volume < 50) {
            icon = '$(unmute)';
        }
        this.volumeIndicator.text = `${icon} ${volume}%`;
        this.volumeIndicator.tooltip = `Volume: ${volume}%\nClick to adjust`;
    }
    showInitialState() {
        this.trackInfo.text = '$(music) SonicFlow';
        this.trackInfo.tooltip = 'Click to open SonicFlow player';
        this.trackInfo.show();
        this.playPauseButton.text = '$(play)';
        this.playPauseButton.tooltip = 'Play';
        this.playPauseButton.show();
        // Hide other items until music is playing
        this.prevButton.hide();
        this.nextButton.hide();
        this.vibeIndicator.hide();
        this.volumeIndicator.hide();
    }
    showAllItems() {
        this.trackInfo.show();
        this.playPauseButton.show();
        this.prevButton.show();
        this.nextButton.show();
        this.vibeIndicator.show();
        this.volumeIndicator.show();
    }
    truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 1) + '…';
    }
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    dispose() {
        this.playPauseButton.dispose();
        this.trackInfo.dispose();
        this.prevButton.dispose();
        this.nextButton.dispose();
        this.vibeIndicator.dispose();
        this.volumeIndicator.dispose();
    }
}
exports.StatusBarController = StatusBarController;
//# sourceMappingURL=StatusBarController.js.map
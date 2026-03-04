import * as vscode from 'vscode';
import { PlayerState, CONSTANTS, Track } from '../utils/Constants';

/**
 * Status bar music controller - always visible at the bottom of VS Code.
 * Shows current track info and provides quick controls.
 */
export class StatusBarController {
    private playPauseButton: vscode.StatusBarItem;
    private trackInfo: vscode.StatusBarItem;
    private prevButton: vscode.StatusBarItem;
    private nextButton: vscode.StatusBarItem;
    private vibeIndicator: vscode.StatusBarItem;
    private volumeIndicator: vscode.StatusBarItem;

    constructor() {
        // Create status bar items (right to left ordering with priority)
        const basePriority = CONSTANTS.STATUSBAR_PRIORITY;

        this.vibeIndicator = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, basePriority + 5
        );
        this.vibeIndicator.command = 'sonicflow.toggleVibeMode';
        this.vibeIndicator.tooltip = 'Toggle Vibe Mode';

        this.volumeIndicator = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, basePriority + 4
        );
        this.volumeIndicator.command = 'sonicflow.setVolume';

        this.nextButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, basePriority + 3
        );
        this.nextButton.text = '$(chevron-right)';
        this.nextButton.command = 'sonicflow.next';
        this.nextButton.tooltip = 'Next Track';

        this.playPauseButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, basePriority + 2
        );
        this.playPauseButton.command = 'sonicflow.playPause';

        this.prevButton = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, basePriority + 1
        );
        this.prevButton.text = '$(chevron-left)';
        this.prevButton.command = 'sonicflow.previous';
        this.prevButton.tooltip = 'Previous Track';

        this.trackInfo = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, basePriority
        );
        this.trackInfo.command = 'sonicflow.openPlayer';
        this.trackInfo.tooltip = 'Open SonicFlow Player';

        this.showInitialState();
    }

    /**
     * Update the status bar based on current player state
     */
    update(state: PlayerState): void {
        if (state.currentTrack) {
            this.updateTrackInfo(state.currentTrack, state.position);
            this.updatePlayPauseButton(state.isPlaying);
            this.updateVibeIndicator(state.vibeMode);
            this.updateVolumeIndicator(state.volume);
            this.showAllItems();
        } else {
            this.showInitialState();
        }
    }

    private updateTrackInfo(track: Track, position: number): void {
        const title = this.truncateText(track.title, CONSTANTS.TRACK_TITLE_MAX_LENGTH);
        const sourceIcon = track.source === 'youtube' ? '$(globe)' : '$(file-media)';
        const timeStr = this.formatTime(position);

        this.trackInfo.text = `${sourceIcon} ${title} - ${track.artist} [${timeStr}]`;
        this.trackInfo.tooltip = `${track.title}\nby ${track.artist}\n\nClick to open player`;
    }

    private updatePlayPauseButton(isPlaying: boolean): void {
        this.playPauseButton.text = isPlaying ? '$(debug-pause)' : '$(play)';
        this.playPauseButton.tooltip = isPlaying ? 'Pause' : 'Play';
    }

    private updateVibeIndicator(vibeMode: boolean): void {
        this.vibeIndicator.text = vibeMode ? '$(pulse) Vibe' : '$(pulse)';
        this.vibeIndicator.color = vibeMode ? '#00E5A0' : undefined;
        this.vibeIndicator.tooltip = vibeMode ? 'Vibe Mode: ON' : 'Vibe Mode: OFF';
    }

    private updateVolumeIndicator(volume: number): void {
        let icon = '$(unmute)';
        if (volume === 0) { icon = '$(mute)'; }
        else if (volume < 50) { icon = '$(unmute)'; }

        this.volumeIndicator.text = `${icon} ${volume}%`;
        this.volumeIndicator.tooltip = `Volume: ${volume}%\nClick to adjust`;
    }

    private showInitialState(): void {
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

    private showAllItems(): void {
        this.trackInfo.show();
        this.playPauseButton.show();
        this.prevButton.show();
        this.nextButton.show();
        this.vibeIndicator.show();
        this.volumeIndicator.show();
    }

    private truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) { return text; }
        return text.substring(0, maxLength - 1) + '…';
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    dispose(): void {
        this.playPauseButton.dispose();
        this.trackInfo.dispose();
        this.prevButton.dispose();
        this.nextButton.dispose();
        this.vibeIndicator.dispose();
        this.volumeIndicator.dispose();
    }
}
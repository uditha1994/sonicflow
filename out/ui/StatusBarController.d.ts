import { PlayerState } from '../utils/Constants';
/**
 * Status bar music controller - always visible at the bottom of VS Code.
 * Shows current track info and provides quick controls.
 */
export declare class StatusBarController {
    private playPauseButton;
    private trackInfo;
    private prevButton;
    private nextButton;
    private vibeIndicator;
    private volumeIndicator;
    constructor();
    /**
     * Update the status bar based on current player state
     */
    update(state: PlayerState): void;
    private updateTrackInfo;
    private updatePlayPauseButton;
    private updateVibeIndicator;
    private updateVolumeIndicator;
    private showInitialState;
    private showAllItems;
    private truncateText;
    private formatTime;
    dispose(): void;
}
//# sourceMappingURL=StatusBarController.d.ts.map
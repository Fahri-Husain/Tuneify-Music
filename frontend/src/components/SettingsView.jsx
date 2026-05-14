import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  HardDrive, 
  Palette, 
  Volume2, 
  Info,
  ChevronRight,
  Bug,
  Send,
  Loader2
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import './SettingsView.css';

const SettingsView = () => {
  const { showToast } = usePlayer();
  const { themePreference, setThemePreference } = useTheme();
  const [quality, setQuality] = useState('high');
  const [autoPlay, setAutoPlay] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  // Bug Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportEmail, setReportEmail] = useState('');
  const [reportIssue, setReportIssue] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleSubmitReport = async () => {
    if (!reportEmail.trim() || !reportIssue.trim()) {
      showToast('Please fill out all fields', 'error');
      return;
    }
    
    setIsSubmittingReport(true);
    try {
      const response = await fetch('https://tuneifymusic2-fy4dlefd.b4a.run/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reportEmail, issue: reportIssue })
      });
      
      if (response.ok) {
        showToast('Bug report sent successfully!', 'success', '✉️');
        setShowReportModal(false);
        setReportEmail('');
        setReportIssue('');
      } else {
        showToast('Failed to send report', 'error');
      }
    } catch (error) {
      showToast('Network error, try again', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleClearCache = () => {
    setConfirmDialog({
      title: 'Clear Cache',
      message: 'Are you sure you want to clear your local cache? This will NOT delete your liked songs or playlists, but will clear recent history.',
      type: 'warning',
      onConfirm: () => {
        localStorage.removeItem('tuneify_recent');
        showToast('Cache cleared successfully', 'success', '🗑️');
        setConfirmDialog(null);
      }
    });
  };

  const handleClearAllData = () => {
    setConfirmDialog({
      title: 'Reset All App Data',
      message: 'WARNING: This will delete ALL your playlists, liked songs, and downloads from this device. Are you absolutely sure?',
      type: 'danger',
      onConfirm: () => {
        localStorage.removeItem('tuneify_liked_songs');
        localStorage.removeItem('tuneify_downloads');
        localStorage.removeItem('tuneify_playlists');
        localStorage.removeItem('tuneify_recent');
        showToast('All app data has been reset. Please refresh.', 'info');
        setConfirmDialog(null);
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };

  return (
    <div className="settings-view">
      <div className="settings-header sticky">
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        
        {/* Playback Section */}
        <section className="settings-section">
          <div className="section-title">
            <Volume2 size={20} className="text-muted" />
            <h2>Playback & Audio</h2>
          </div>
          <div className="settings-card glass-panel">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Audio Quality</h3>
                <p className="text-muted">Adjust streaming quality</p>
              </div>
              <select 
                className="setting-select" 
                value={quality} 
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="data-saver">Data Saver (Low)</option>
                <option value="normal">Normal</option>
                <option value="high">High Quality (320kbps)</option>
              </select>
            </div>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>Autoplay</h3>
                <p className="text-muted">Keep listening to similar tracks when your music ends</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoPlay} 
                  onChange={() => setAutoPlay(!autoPlay)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <h3>Equalizer</h3>
                <p className="text-muted">Adjust audio frequencies (Coming Soon)</p>
              </div>
              <ChevronRight size={20} className="text-muted" />
            </div>
          </div>
        </section>

        {/* Data & Storage Section */}
        <section className="settings-section">
          <div className="section-title">
            <HardDrive size={20} className="text-muted" />
            <h2>Data & Storage</h2>
          </div>
          <div className="settings-card glass-panel">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Download over Wi-Fi only</h3>
                <p className="text-muted">Save cellular data</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item clickable hover-bg" onClick={handleClearCache}>
              <div className="setting-info">
                <h3>Clear Cache</h3>
                <p className="text-muted">Free up space (does not delete downloads/likes)</p>
              </div>
              <Trash2 size={20} className="text-muted" />
            </div>

            <div className="setting-item clickable hover-bg-danger" onClick={handleClearAllData}>
              <div className="setting-info">
                <h3 style={{ color: '#f87171' }}>Reset All App Data</h3>
                <p className="text-muted">Permanently delete all liked songs and playlists</p>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-section">
          <div className="section-title">
            <Palette size={20} className="text-muted" />
            <h2>Appearance</h2>
          </div>
          <div className="settings-card glass-panel">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Theme</h3>
                <p className="text-muted">Select your preferred appearance</p>
              </div>
              <select 
                className="setting-select" 
                value={themePreference} 
                onChange={(e) => setThemePreference(e.target.value)}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">Device System</option>
              </select>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <div className="section-title">
            <Info size={20} className="text-muted" />
            <h2>About</h2>
          </div>
          <div className="settings-card glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon size={32} color="black" />
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Tuneify Music</h2>
            <p className="text-muted" style={{ margin: '0 0 16px' }}>Version 1.0.0 (Beta)</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div className="badge-item">
                <Info size={16} /> Privacy Policy
              </div>
              <div className="badge-item">
                <Info size={16} /> Open Source
              </div>
            </div>
          </div>
        </section>

        {/* Support & Feedback */}
        <section className="settings-section">
          <div className="section-title">
            <Bug size={20} className="text-muted" />
            <h2>Support & Feedback</h2>
          </div>
          <div className="settings-card glass-panel">
            <div className="setting-item clickable hover-bg" onClick={() => setShowReportModal(true)}>
              <div className="setting-info">
                <h3>Bug & Report</h3>
                <p className="text-muted">Tell us about an issue or feature request</p>
              </div>
              <ChevronRight size={20} className="text-muted" />
            </div>
          </div>
        </section>

        {/* Spacer for bottom player */}
        <div style={{ height: '100px' }}></div>
      </div>

      {/* Elegant Bug Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => !isSubmittingReport && setShowReportModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bug size={24} color="var(--primary)" />
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: 'var(--text-main)' }}>Report a Bug</h2>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>We'll get back to you directly.</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                <input 
                  type="email" 
                  className="modal-input" 
                  placeholder="your.email@example.com" 
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--modal-input-border)', background: 'var(--modal-input-bg)', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Issue Description</label>
                <textarea 
                  className="modal-input" 
                  placeholder="Describe the problem or suggestion in detail..." 
                  value={reportIssue}
                  onChange={(e) => setReportIssue(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--modal-input-border)', background: 'var(--modal-input-bg)', color: 'white', resize: 'vertical' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="modal-btn" 
                style={{ background: 'var(--modal-cancel-bg)', color: 'var(--text-main)', padding: '12px 24px' }}
                onClick={() => setShowReportModal(false)}
                disabled={isSubmittingReport}
              >
                Cancel
              </button>
              <button 
                className="modal-btn" 
                style={{ background: 'var(--primary)', color: 'black', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', opacity: isSubmittingReport ? 0.7 : 1 }}
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? (
                  <Loader2 size={18} className="spin-elegant" />
                ) : (
                  <Send size={18} />
                )}
                <span>{isSubmittingReport ? 'Sending...' : 'Send Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Confirm Dialog Overlay */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: confirmDialog.type === 'danger' ? 'rgba(248, 113, 113, 0.1)' : 'var(--modal-input-bg)'
            }}>
              {confirmDialog.type === 'danger' ? <Trash2 size={32} color="#f87171" /> : <HardDrive size={32} color="var(--primary)" />}
            </div>
            
            <h2 style={{ margin: '0 0 12px', fontSize: '1.4rem', color: confirmDialog.type === 'danger' ? '#f87171' : 'var(--text-main)' }}>
              {confirmDialog.title}
            </h2>
            <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '32px' }}>
              {confirmDialog.message}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="modal-btn" 
                style={{ flex: 1, background: 'var(--modal-cancel-bg)', color: 'var(--text-main)' }}
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn" 
                style={{ flex: 1, background: confirmDialog.type === 'danger' ? '#f87171' : 'var(--primary)', color: confirmDialog.type === 'danger' ? 'white' : 'black' }}
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;

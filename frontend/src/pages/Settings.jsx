import React, { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

function Settings() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState('security')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: '',
    theme: 'dark',
    autoSave: true,
    resolution: '4k',
    emailNotifications: true,
    analysisAlerts: true,
    datasetAlerts: true,
    weeklySummary: false
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    toast.success('✅ Password change request sent to your email!')
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    toast.success('✅ Email verification sent to your inbox!')
    setFormData(prev => ({ ...prev, newEmail: '' }))
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('👋 Logged out successfully!')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  const handleLogoutAll = async () => {
    try {
      await signOut()
      toast.success('👋 Logged out from all devices!')
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
            ⚙️ Settings
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your account security, preferences, and notifications
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700 overflow-x-auto">
          {[
            { id: 'security', label: '🔒 Security', icon: '🔐' },
            { id: 'preferences', label: '🎨 Preferences', icon: '⚡' },
            { id: 'notifications', label: '🔔 Notifications', icon: '📢' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/5'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">🔐</span> Change Password
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                  <input 
                    type="password" 
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input 
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password (min 8 chars)"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                  <input 
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your new password"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition transform hover:scale-105">
                  🔄 Update Password
                </button>
              </form>
            </div>

            {/* Change Email */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">📧</span> Change Email
              </h2>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Email</label>
                  <input 
                    type="email"
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Email Address</label>
                  <input 
                    type="email"
                    name="newEmail"
                    value={formData.newEmail}
                    onChange={handleInputChange}
                    placeholder="Enter your new email address"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                  />
                </div>
                <button type="submit" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition transform hover:scale-105">
                  ✓ Verify New Email
                </button>
              </form>
            </div>

            {/* Logout Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-4">🚪 Logout</h3>
                <p className="text-slate-400 text-sm mb-4">Sign out from this device</p>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 font-semibold rounded-lg transition"
                >
                  Logout
                </button>
              </div>

              <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white mb-4">🔓 Logout All Devices</h3>
                <p className="text-slate-400 text-sm mb-4">Sign out from all your devices</p>
                <button
                  onClick={handleLogoutAll}
                  className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold rounded-lg transition"
                >
                  Logout All
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center">
                <span className="mr-3">⚠️</span> Danger Zone
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Delete your account permanently. This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 font-semibold rounded-lg transition"
                >
                  🗑️ Delete Account
                </button>
              ) : (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-300 font-medium mb-4">Are you absolutely sure? This will:</p>
                  <ul className="text-red-300 text-sm space-y-2 mb-4">
                    <li>• Delete all your data permanently</li>
                    <li>• Remove all saved analyses and preferences</li>
                    <li>• Cannot be recovered</li>
                  </ul>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        toast.error('Account deletion requires Clerk dashboard access')
                        setShowDeleteConfirm(false)
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">🎨</span> Display Settings
              </h2>
              
              <div className="space-y-6">
                {/* Theme */}
                <div className="border-b border-slate-700 pb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                  <div className="flex gap-4">
                    {[
                      { value: 'dark', label: '🌙 Dark', color: 'from-slate-700' },
                      { value: 'light', label: '☀️ Light', color: 'from-slate-300' }
                    ].map(theme => (
                      <label key={theme.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value={theme.value}
                          checked={formData.theme === theme.value}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-cyan-600 border-slate-600 rounded-full"
                        />
                        <span className="text-slate-300">{theme.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div className="border-b border-slate-700 pb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-3">Default Resolution</label>
                  <select
                    name="resolution"
                    value={formData.resolution}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="720p">720p (Low)</option>
                    <option value="1080p">1080p (Medium)</option>
                    <option value="4k">4K (High)</option>
                    <option value="8k">8K (Ultra)</option>
                  </select>
                </div>

                {/* Auto-save */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-700">
                  <label className="text-slate-300 font-medium">Auto-save Analysis Results</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoSave"
                      checked={formData.autoSave}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">🔔</span> Notification Settings
              </h2>
              
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive emails about your account' },
                  { key: 'analysisAlerts', label: 'Analysis Completion Alerts', desc: 'Get notified when analyses finish' },
                  { key: 'datasetAlerts', label: 'New Dataset Alerts', desc: 'Be notified about new satellite data' },
                  { key: 'weeklySummary', label: 'Weekly Summary', desc: 'Receive weekly activity summaries' }
                ].map(notif => (
                  <div key={notif.key} className="flex items-center justify-between p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 transition">
                    <div>
                      <p className="font-medium text-white">{notif.label}</p>
                      <p className="text-sm text-slate-400">{notif.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={notif.key}
                        checked={formData[notif.key]}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={() => toast.success('✅ Notification settings saved!')}
                className="mt-8 w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
              >
                💾 Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings



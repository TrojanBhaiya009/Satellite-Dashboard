import React, { useState } from 'react'
import { SignIn, SignUp } from '@clerk/clerk-react'

function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .cl-rootBox,
        .clerk-root,
        .cl-card,
        .cl-main,
        .cl-formContainer,
        .cl-formWrapper,
        .cl-component,
        .cl-modalContent {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        .cl-form {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .cl-formButtonPrimary {
          background: linear-gradient(135deg, #06b6d4, #22c55e) !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          width: 100% !important;
        }

        .cl-formButtonPrimary:hover {
          opacity: 0.9 !important;
        }

        .cl-formFieldInput {
          background: rgba(30, 41, 59, 0.8) !important;
          border: 1.5px solid rgba(6, 182, 212, 0.3) !important;
          color: #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 12px 14px !important;
          font-size: 14px !important;
          width: 100% !important;
        }

        .cl-formFieldInput::placeholder {
          color: rgba(148, 163, 184, 0.5) !important;
        }

        .cl-formFieldInput:focus {
          border-color: #06b6d4 !important;
          background: rgba(30, 41, 59, 0.9) !important;
          outline: none !important;
          color: white !important;
        }

        .cl-formFieldLabel {
          color: #e2e8f0 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }

        .cl-headerTitle {
          color: white !important;
          font-size: 18px !important;
          font-weight: 700 !important;
        }

        .cl-headerSubtitle {
          color: rgba(148, 163, 184, 0.8) !important;
          font-size: 13px !important;
        }

        .cl-socialButtonsBlockButton {
          background: rgba(30, 41, 59, 0.6) !important;
          border: 1.5px solid rgba(6, 182, 212, 0.25) !important;
          color: white !important;
          border-radius: 8px !important;
          padding: 12px 14px !important;
          width: 100% !important;
          font-size: 14px !important;
          font-weight: 500 !important;
        }

        .cl-socialButtonsBlockButton:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          border-color: #06b6d4 !important;
        }

        .cl-footer, .cl-badge, .cl-footerPagesLink {
          display: none !important;
        }

        div[class*="Development"] {
          display: none !important;
        }

        .cl-internal-b3fm6y {
          color: #e2e8f0 !important;
        }

        input[type="password"] {
          color: white !important;
          background: rgba(30, 41, 59, 0.8) !important;
        }

        .cl-formFieldInputShowPasswordButton {
          color: rgba(148, 163, 184, 0.8) !important;
        }

        .cl-dividerLine {
          background: rgba(6, 182, 212, 0.2) !important;
        }

        .cl-dividerText {
          color: rgba(148, 163, 184, 0.9) !important;
          background: transparent !important;
          font-size: 12px !important;
        }

        .cl-otpCodeFieldInput {
          background: rgba(30, 41, 59, 0.8) !important;
          border: 1.5px solid rgba(6, 182, 212, 0.3) !important;
          color: white !important;
        }

        .cl-formFieldAction {
          color: #06b6d4 !important;
        }

        .cl-footerActionLink {
          color: #22c55e !important;
        }

        .cl-footerActionText {
          color: rgba(148, 163, 184, 0.8) !important;
        }

        * {
          color: inherit;
        }

        .cl-formFieldSuccessText,
        .cl-formFieldInfoText,
        .cl-formFieldWarningText,
        .cl-formFieldErrorText {
          color: rgba(148, 163, 184, 0.9) !important;
        }

        .cl-formFieldErrorText {
          color: #ef4444 !important;
        }

        .cl-formFieldSuccessText {
          color: #22c55e !important;
        }

        .cl-identityPreview,
        .cl-identityPreviewText,
        .cl-identityPreviewEditButton {
          color: rgba(148, 163, 184, 0.9) !important;
        }

        p, span, div, label, a {
          color: rgba(226, 232, 240, 0.9) !important;
        }

        .cl-formHeaderTitle,
        .cl-formHeaderSubtitle {
          color: white !important;
        }

        [class*="cl-internal-"] {
          background: transparent !important;
          border: none !important;
        }

        .cl-rootBox > div,
        .cl-card > div,
        .cl-main > div {
          background: transparent !important;
        }

        [class*="cl-"] > div {
          background: transparent !important;
        }

        div[class^="cl-"],
        div[class*=" cl-"] {
          background: transparent !important;
        }

        .cl-formFieldRow,
        .cl-formFieldGroup,
        .cl-socialButtons,
        .cl-footer,
        .cl-footerPages {
          background: transparent !important;
        }

        /* Nuclear option - force all backgrounds transparent */
        [class*="cl-"] {
          background: transparent !important;
        }
      `}</style>

      <h1 style={{
        fontSize: '32px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        🛰️ SatelliteAI
      </h1>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => setIsSignUp(false)}
          style={{
            padding: '8px 24px',
            background: isSignUp ? 'transparent' : 'rgba(6, 182, 212, 0.25)',
            color: 'white',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsSignUp(true)}
          style={{
            padding: '8px 24px',
            background: isSignUp ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
            color: 'white',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          Sign Up
        </button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto'
      }}>
        {isSignUp ? (
          <SignUp 
            routing="hash"
            afterSignUpUrl="/"
            appearance={{
              baseTheme: 'dark',
              layout: {
                socialButtonsVariant: 'blockButton',
                logoImageUrl: undefined
              },
              elements: {
                rootBox: {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                },
                card: {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                },
                footer: {
                  display: 'none'
                }
              }
            }}
          />
        ) : (
          <SignIn 
            routing="hash"
            afterSignInUrl="/"
            appearance={{
              baseTheme: 'dark',
              layout: {
                socialButtonsVariant: 'blockButton',
                logoImageUrl: undefined
              },
              elements: {
                rootBox: {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                },
                card: {
                  backgroundColor: 'transparent',
                  boxShadow: 'none'
                },
                footer: {
                  display: 'none'
                }
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Auth

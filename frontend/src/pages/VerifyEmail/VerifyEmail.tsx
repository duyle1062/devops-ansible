import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import styles from "./VerifyEmail.module.css";
import authService from "../../services/auth.service";

interface Errors {
  server?: string;
}

const VerifyEmail: React.FC = () => {
  const [errors, setErrors] = useState<Errors>({});
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const uid = searchParams.get("uid") || location.state?.uid || "";
  const token = searchParams.get("token") || location.state?.token || "";

  useEffect(() => {
    const autoVerify = async () => {
      if (!uid || !token || verifying || verified) return;

      setVerifying(true);
      try {
        await authService.verifyEmail({ uid, token });
        setVerified(true);
        setErrors({});
        setTimeout(() => {
          navigate("/login", {
            state: { message: "Email verified successfully! Please login." },
          });
        }, 2000);
      } catch (error: any) {
        console.error("Verification error:", error);
        const serverErrors = error?.response?.data;
        if (serverErrors?.detail) {
          setErrors({ server: serverErrors.detail });
        } else if (serverErrors?.uid || serverErrors?.token) {
          setErrors({
            server:
              "Invalid or expired verification link. Please try registering again.",
          });
        } else {
          setErrors({
            server: "Verification failed. The link may be invalid or expired.",
          });
        }
      } finally {
        setVerifying(false);
      }
    };

    autoVerify();
  }, [uid, token, verifying, verified, navigate]);

  if (!uid || !token) {
    return (
      <div className={styles.container}>
        <div className={styles.wrapperOtp}>
          <h2 className={styles.header}>Invalid Verification Link</h2>
          <p className={styles.otpText}>
            This link is missing required information. Please request a new
            verification email.
          </p>
          <Link to="/login" className={styles.returnButton}>
            Return to Login Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapperOtp}>
        {verifying ? (
          <>
            <div className={styles.iconContainer}>
              <svg
                className={styles.emailIcon}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  width="64"
                  height="64"
                  rx="32"
                  fill="var(--brand-red-primary)"
                  opacity="0.1"
                />
                <path
                  d="M20 24L32 32L44 24M20 24V40C20 41.1046 20.8954 42 22 42H42C43.1046 42 44 41.1046 44 40V24M20 24H44"
                  stroke="var(--brand-red-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className={styles.header}>Verifying Your Email</h2>
            <p className={styles.otpText}>
              Please wait while we verify your email address...
            </p>
            <div className={styles.loadingSpinner}></div>
          </>
        ) : verified ? (
          <>
            <div className={styles.iconContainer}>
              <svg
                className={styles.emailIcon}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  width="64"
                  height="64"
                  rx="32"
                  fill="var(--success-color)"
                  opacity="0.1"
                />
                <path
                  d="M20 32L28 40L44 24"
                  stroke="var(--success-color)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className={styles.header}>Email Verified Successfully!</h2>
            <p className={styles.otpText}>
              Your email has been successfully verified. You will be redirected
              to the login page shortly.
            </p>
            <Link to="/login" className={styles.returnButton}>
              Go to Login Page
            </Link>
          </>
        ) : (
          <>
            <div className={styles.iconContainer}>
              <svg
                className={styles.emailIcon}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  width="64"
                  height="64"
                  rx="32"
                  fill="var(--status-cancelled-text)"
                  opacity="0.1"
                />
                <path
                  d="M24 24L40 40M40 24L24 40"
                  stroke="var(--status-cancelled-text)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className={styles.header}>Verification Failed</h2>
            <p
              className={styles.otpText}
              style={{ color: "var(--status-cancelled-text)" }}
            >
              {errors.server ||
                "Failed to verify your email. The verification link may have expired or is invalid."}
            </p>
            <p className={styles.otpText}>
              Please try registering again or contact support if the problem
              persists.
            </p>
            <Link to="/login" className={styles.returnButton}>
              Return to Login Page
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

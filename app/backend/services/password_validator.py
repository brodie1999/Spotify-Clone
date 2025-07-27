import re
from typing import List, Tuple
from pydantic import BaseModel
from app.backend.config import settings

class PasswordValidationResult(BaseModel):
    is_valid: bool
    errors: List[str]
    strength_score: int # 0 - 100

class PasswordValidator:
    """Comprehensive password validation service"""

    def __init__(self):
        self.min_length = settings.min_password_length
        self.max_length = settings.max_password_length

    def validate_password(self, password: str) -> PasswordValidationResult:
        """Validate password against security requirements"""
        errors = []
        strength_score = 0

        # Length validation
        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters long")
        elif len(password) > self.max_length:
            errors.append(f"Password must be at most {self.max_length} characters long")
        else:
            strength_score += 20

        # Character type requirements
        has_lower = bool(re.search(r"[a-z]", password))
        has_upper = bool(re.search(r"[A-Z]", password))
        has_digit = bool(re.search(r"[0-9]", password))
        has_special = bool(re.search(r"[^A-Za-z0-9]", password))

        if not has_lower:
            errors.append(f"Password must contain at least one lowercase letter")
        else:
            strength_score += 15

        if not has_upper:
            errors.append(f"Password must contain at least one uppercase letter")
        else:
            strength_score += 15

        if not has_digit:
            errors.append(f"Password must contain at least one digit")
        else:
            strength_score += 15

        if not has_special:
            errors.append(f"Password must contain at least one special character")
        else:
            strength_score += 15

        # Additional strength checks
        if len(password) >= 12:
            strength_score += 10
        if len(password) >= 16:
            strength_score += 10

        # Check for common patterns
        if self._has_common_patterns(password):
            errors.append(f"Password contains common patterns")
            strength_score -= 20

        # Check for repeated characters
        if self._has_excessive_repeats(password):
            errors.append(f"Password contains excessive repetitions")
            strength_score -= 20

        strength_score = max(0, min(100, strength_score))

        return PasswordValidationResult(is_valid=len(errors) == 0,
                                        errors=errors,
                                        strength_score=strength_score
        )

    def _has_common_patterns(self, password: str) -> bool:
        """Check for common weak patterns"""
        password_lower = password.lower()

        # Common sequences
        sequences = [
            '123456', '654321', 'abcdef', 'fedcba',
            'qwerty', 'asdfgh', 'zxcvbn', 'password',
            'letmein', 'welcome', 'admin', 'user',
        ]

        return any(seq in password_lower for seq in sequences)

    def _has_excessive_repeats(self, password: str) -> bool | None:
        """Check for excessive repetitions"""
        max_repeats = 3
        for i in range(len(password) - max_repeats + 1):
            if len(set(password[i:i + max_repeats])) == 1:
                return True
            return False

    def get_strength_message(self, score: int) -> str:
        """Get human-readable strength message"""
        if score >= 80:
            return "Very Strong"
        elif  score >= 60:
            return "Strong"
        elif score >= 40:
            return "Moderate"
        elif score >= 20:
            return "Weak"
        else:
            return "Very Weak"


# Global validator instance
password_validator = PasswordValidator()


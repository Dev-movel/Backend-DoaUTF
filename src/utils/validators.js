const validatePasswordComplexity = (password) => {
    if (!password || typeof password !== 'string' || password.length < 8) {
        return false;
    }

    const checks = {
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\/\\]/.test(password)
    };

    const metCount = Object.values(checks).filter(Boolean).length;

    return metCount >= 3;
};

module.exports = {
    validatePasswordComplexity
};
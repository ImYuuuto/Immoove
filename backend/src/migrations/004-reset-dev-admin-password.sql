-- Development-only admin credential reset.
UPDATE users
SET
    password_hash = 'scrypt:a881f76777e66eaa1c2d13983377e483:131adc35d298e65fdd55dcb4d493b567ea5c20c0486634421175502aa8b6bd300494418e4678a587dcba3fa5315f19d755c612083cdaa0f20701bdbb9f85f58a'
WHERE
    email = 'amina@example.com';
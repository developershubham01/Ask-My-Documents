import { SignIn, SignUp } from '@clerk/clerk-react';
import { Box, Typography } from '@mui/material';

const authContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  bgcolor: 'background.default',
  p: 3,
};

const HeaderLogo = () => (
  <Box sx={{ mb: 4, textAlign: 'center' }}>
    <Typography
      variant="h4"
      sx={{
        fontWeight: 800,
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      DocAnalyzer AI
    </Typography>
    <Typography variant="subtitle1" color="text.secondary">
      Enterprise RAG System
    </Typography>
  </Box>
);

export function LoginPage() {
  return (
    <Box sx={authContainerStyle}>
      <HeaderLogo />
      <SignIn routing="path" path="/login" signUpUrl="/signup" forceRedirectUrl="/welcome" />
    </Box>
  );
}

export function SignUpPage() {
  return (
    <Box sx={authContainerStyle}>
      <HeaderLogo />
      <SignUp routing="path" path="/signup" signInUrl="/login" forceRedirectUrl="/welcome" />
    </Box>
  );
}

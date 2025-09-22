import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Shield, AlertCircle } from 'lucide-react';
import { verifyPassword, unlockApp, isAppUnlocked } from '@/utils/appLock';

const LockScreen = () => {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if already unlocked
  if (isAppUnlocked()) {
    return <Navigate to="/" replace />;
  }

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyPassword(password);
      
      if (isValid) {
        unlockApp();
        // Navigation will happen automatically due to the redirect check above
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(`Invalid password. ${newAttempts >= 3 ? 'Multiple failed attempts detected.' : ''}`);
        setPassword('');
        
        // Announce error to screen readers
        const errorElement = document.getElementById('password-error');
        if (errorElement) {
          errorElement.setAttribute('aria-live', 'assertive');
        }
      }
    } catch (err) {
      setError('An error occurred while verifying the password. Please try again.');
    } finally {
      setIsVerifying(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <>
      {/* Add noindex meta tag */}
      <meta name="robots" content="noindex" />
      
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">App Locked</h1>
              <p className="text-muted-foreground">
                Enter the password to access Amazon Research Playbook
              </p>
            </div>
          </div>

          {/* Lock Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter password"
                  className="pl-10"
                  disabled={isVerifying}
                  aria-describedby={error ? "password-error" : undefined}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription id="password-error">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || !password.trim()}
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            This app is protected by password authentication
          </div>
        </div>
      </div>
    </>
  );
};

export default LockScreen;
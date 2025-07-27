import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface ApiKeyManagerProps {
  onApiKeyChange: (apiKey: string) => void;
}

export default function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isValidKey, setIsValidKey] = useState(false);

  useEffect(() => {
    // Load API key from localStorage on mount
    const savedKey = localStorage.getItem('openai-api-key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsValidKey(validateApiKey(savedKey));
      onApiKeyChange(savedKey);
    }
  }, [onApiKeyChange]);

  const validateApiKey = (key: string): boolean => {
    // Basic OpenAI API key validation
    return key.startsWith('sk-') && key.length >= 51;
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    const isValid = validateApiKey(value);
    setIsValidKey(isValid);
    
    if (isValid) {
      localStorage.setItem('openai-api-key', value);
      onApiKeyChange(value);
    } else if (value === '') {
      localStorage.removeItem('openai-api-key');
      onApiKeyChange('');
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    setIsValidKey(false);
    localStorage.removeItem('openai-api-key');
    onApiKeyChange('');
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-ai-primary" />
          OpenAI API Configuration
        </CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable real AI-powered SQL generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {apiKey && (
                <>
                  {isValidKey ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 h-auto"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          </div>
          {apiKey && (
            <Button variant="outline" onClick={clearApiKey}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isValidKey ? "default" : "secondary"}>
            {isValidKey ? "Valid Key" : apiKey ? "Invalid Key" : "No Key"}
          </Badge>
          {!isValidKey && !apiKey && (
            <Badge variant="outline">
              Demo Mode
            </Badge>
          )}
        </div>

        {!isValidKey && apiKey && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid API key format. OpenAI keys start with "sk-" and are 51+ characters long.
            </AlertDescription>
          </Alert>
        )}

        {!apiKey && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>Without an API key, the app will use mock responses for demonstration.</p>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Get API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <span className="text-xs text-muted-foreground">
                  Your key is stored locally and never sent to our servers
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
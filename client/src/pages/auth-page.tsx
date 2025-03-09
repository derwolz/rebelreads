import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema, loginSchema } from "@shared/schema";
// Removed unused imports: Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription, Input, Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger, Checkbox, RadioGroup, RadioGroupItem, SiGoogle, SiAmazon, SiX

import { useEffect } from "react";
import { Redirect } from "wouter";
import { useAuthModal } from "@/hooks/use-auth-modal";

export default function AuthPage() {
  const { user } = useAuth();
  const { setIsOpen } = useAuthModal();

  useEffect(() => {
    setIsOpen(true);
    return () => setIsOpen(false);
  }, [setIsOpen]);

  if (user) {
    return <Redirect to={user.isAuthor ? "/pro" : "/"} />;
  }

  return null;
}
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SqlGenerator from "@/components/SqlGenerator";
import DatabaseSchema from "@/components/DatabaseSchema";
import { MessageSquare, Database } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("generator");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 border border-border/50">
            <TabsTrigger 
              value="generator" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-ai-primary data-[state=active]:to-ai-accent data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              SQL Generator
            </TabsTrigger>
            <TabsTrigger 
              value="schema"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-success data-[state=active]:to-primary-glow data-[state=active]:text-white"
            >
              <Database className="h-4 w-4" />
              Database Schema
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="mt-0">
            <SqlGenerator />
          </TabsContent>
          
          <TabsContent value="schema" className="mt-0">
            <DatabaseSchema />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

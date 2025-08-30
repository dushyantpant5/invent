'use client';

import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function JoinCreateInventory() {
  const [inventoryCode, setInventoryCode] = useState('');
  const [inventoryName, setInventoryName] = useState('');

  const handleJoin = () => {
    // TODO: Join inventory with code
    console.log('Joining inventory with code:', inventoryCode);
  };

  const handleCreate = () => {
    // TODO: Create new inventory
    console.log('Creating inventory:', inventoryName);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Get Started</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join">Join</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="mt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleJoin();
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="join-code">Inventory Code</Label>
                  <Input
                    id="join-code"
                    placeholder="e.g. INV1234"
                    value={inventoryCode}
                    onChange={(e) => setInventoryCode(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Join Inventory
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create" className="mt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="inventory-name">Inventory Name</Label>
                  <Input
                    id="inventory-name"
                    placeholder="e.g. My Store Room"
                    value={inventoryName}
                    onChange={(e) => setInventoryName(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Inventory
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

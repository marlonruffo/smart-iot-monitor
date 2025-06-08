import React from 'react';
import Navbar from './components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to IoT Sensor Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Monitor your IoT sensors and readings with ease. Navigate to the Sensors or Readings sections using the menu above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
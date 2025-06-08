import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom'; 

function Navbar() {
  return (
    <nav className="bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold text-foreground">
          IoT Monitor
        </Link>
        <div className="flex space-x-4">
          <Link to="/">
            <Button variant="ghost" className="text-sm font-medium">
              Home
            </Button>
          </Link>
          <Link to="/sensors">
            <Button variant="ghost" className="text-sm font-medium">
              Sensors
            </Button>
          </Link>
          <Link to="/readings">
            <Button variant="ghost" className="text-sm font-medium">
              Readings
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
//
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Clock } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    pickupPointName: string;
    latitude: number;
    longitude: number;
    proposedTime: string;
  }) => void;
  walkingRadiusMeters?: number;
  initialLocation?: { latitude: number; longitude: number };
}

/**
 * LocationModal
 * 
 * Interactive dialog that allows a driver or rider to drop a pickup pin
 * constrained within the student's walking radius (10m - 200m) and pick a time.
 */
export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  walkingRadiusMeters = 50,
  initialLocation = { latitude: 49.2606, longitude: -123.246 },
}) => {
  const [name, setName] = useState('Corner of 10th & Main');
  const [time, setTime] = useState('08:30');
  const [lat, setLat] = useState(initialLocation.latitude);
  const [lng, setLng] = useState(initialLocation.longitude);

  const handleSubmit = () => {
    if (!name.trim() || !time.trim()) return;
    onSubmit({
      pickupPointName: name.trim(),
      latitude: lat,
      longitude: lng,
      proposedTime: time.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Suggest Pickup Spot
          </DialogTitle>
          <DialogDescription className="text-xs">
            Drop a pin within the rider's walking radius ({walkingRadiusMeters} meters) and agree on a time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Simulated Map Canvas with walking radius circle */}
          <div className="h-44 w-full rounded-md border bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden text-xs text-slate-500">
            <div
              className="absolute rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center animate-pulse"
              style={{
                width: `${Math.min(180, Math.max(60, walkingRadiusMeters))}px`,
                height: `${Math.min(180, Math.max(60, walkingRadiusMeters))}px`,
              }}
            >
              <span className="text-[10px] text-primary/70 font-mono">
                {walkingRadiusMeters}m radius
              </span>
            </div>
            <div className="z-10 flex flex-col items-center text-primary">
              <MapPin className="h-6 w-6 fill-primary text-white" />
              <span className="font-semibold text-slate-700 mt-1">Pickup Pin</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Pickup Location Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Campus North Bus Loop"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pickup Time
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Send to Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

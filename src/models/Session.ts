import mongoose, { Document, Schema } from 'mongoose';

// Interface for Session document
interface ISession extends Document {
  title: string;
  meetLink: string;
  startTime: Date;
  duration: number;
  status: 'scheduled' | 'active' | 'completed' | 'failed';
  participants: {
    tutors: string[];
    students: string[];
  };
  attendance: {
    [email: string]: {
      joinTime?: Date;
      leaveTime?: Date;
    };
  };
  automation: {
    meetStarted: boolean;
    recordingStarted: boolean;
    lastError?: string;
    retryCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Create Session Schema
const SessionSchema = new Schema<ISession>({
  title: {
    type: String,
    required: true,
  },
  meetLink: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    default: 60, // default duration in minutes
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'failed'],
    default: 'scheduled',
  },
  participants: {
    tutors: [{
      type: String,  // email addresses
      required: true,
    }],
    students: [{
      type: String,  // email addresses
      required: true,
    }],
  },
  attendance: {
    type: Map,
    of: {
      joinTime: Date,
      leaveTime: Date,
    },
    default: {},
  },
  automation: {
    meetStarted: {
      type: Boolean,
      default: false,
    },
    recordingStarted: {
      type: Boolean,
      default: false,
    },
    lastError: String,
    retryCount: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,  // Automatically add createdAt and updatedAt fields
});

// Create and export the model
export const Session = mongoose.model<ISession>('Session', SessionSchema);

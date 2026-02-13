import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
    guestId: mongoose.Types.ObjectId;
    roomId: mongoose.Types.ObjectId;
    checkInDate: Date;
    checkOutDate: Date;
    numberOfGuests: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
    specialRequests?: string;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        guestId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Guest ID is required'],
        },
        roomId: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: [true, 'Room ID is required'],
        },
        checkInDate: {
            type: Date,
            required: [true, 'Check-in date is required'],
        },
        checkOutDate: {
            type: Date,
            required: [true, 'Check-out date is required'],
        },
        numberOfGuests: {
            type: Number,
            required: [true, 'Number of guests is required'],
            min: [1, 'At least one guest is required'],
        },
        totalPrice: {
            type: Number,
            required: [true, 'Total price is required'],
            min: [0, 'Price cannot be negative'],
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
            default: 'pending',
        },
        specialRequests: {
            type: String,
            maxlength: [500, 'Special requests cannot exceed 500 characters'],
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Validate check-out date is after check-in date
// Validate check-out date is after check-in date
bookingSchema.pre('save', function () {
    if (this.checkOutDate <= this.checkInDate) {
        throw new Error('Check-out date must be after check-in date');
    }
});

// Indexes for efficient queries
bookingSchema.index({ guestId: 1, createdAt: -1 });
bookingSchema.index({ roomId: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;

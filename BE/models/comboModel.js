import mongoose from "mongoose";

    const comboSchema = mongoose.Schema(
      {
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        items: [
          {
            name: {
              type: String,
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
            },
          },
        ],
        image: {
          type: String,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        category: {
          type: String,
          enum: ["popcorn", "drinks", "snacks", "combo"],
          default: "combo",
        },
      },
      {
        timestamps: true,
      }
    );

const Combo = mongoose.model("Combo", comboSchema);

export default Combo;
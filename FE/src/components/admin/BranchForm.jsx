"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Map, Building, MapPin, Phone, Clock, Loader2 } from "lucide-react"
import MapSelector from "./MapSelector"

const BranchForm = ({ branch, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: "",
        location: {
            address: "",
            city: "",
            province: "",
            coordinates: {
                latitude: 10.8231,
                longitude: 106.6297,
            },
        },
        contact: {
            phone: "",
            email: "",
        },
        operatingHours: {
            open: "09:00",
            close: "23:00",
        },
        facilities: [],
        image: "",
        isActive: true,
    })

    const [newFacility, setNewFacility] = useState("")
    const [showMap, setShowMap] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (branch) {
            console.log("Editing branch:", branch)
            setFormData({
                name: branch.name || "",
                location: {
                    address: branch.location?.address || "",
                    city: branch.location?.city || "",
                    province: branch.location?.province || "",
                    coordinates: {
                        latitude: branch.location?.coordinates?.latitude || 10.8231,
                        longitude: branch.location?.coordinates?.longitude || 106.6297,
                    },
                },
                contact: {
                    phone: branch.contact?.phone || "",
                    email: branch.contact?.email || "",
                },
                operatingHours: {
                    open: branch.operatingHours?.open || "09:00",
                    close: branch.operatingHours?.close || "23:00",
                },
                facilities: branch.facilities || [],
                image: branch.image || "",
                isActive: branch.isActive !== undefined ? branch.isActive : true,
            })
        }
    }, [branch])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        const keys = name.split(".")

        if (keys.length === 1) {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }))
        } else if (keys.length === 2) {
            setFormData((prev) => ({
                ...prev,
                [keys[0]]: {
                    ...prev[keys[0]],
                    [keys[1]]: value,
                },
            }))
        } else if (keys.length === 3) {
            setFormData((prev) => ({
                ...prev,
                [keys[0]]: {
                    ...prev[keys[0]],
                    [keys[1]]: {
                        ...prev[keys[0]][keys[1]],
                        [keys[2]]: Number.parseFloat(value) || value,
                    },
                },
            }))
        }

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const addFacility = () => {
        if (newFacility.trim() && !formData.facilities.includes(newFacility.trim())) {
            setFormData((prev) => ({
                ...prev,
                facilities: [...prev.facilities, newFacility.trim()],
            }))
            setNewFacility("")
        }
    }

    const removeFacility = (facilityToRemove) => {
        setFormData((prev) => ({
            ...prev,
            facilities: prev.facilities.filter((facility) => facility !== facilityToRemove),
        }))
    }

    const handleLocationSelect = (locationData) => {
        console.log("Location selected:", locationData)

        // Auto-fill location fields from map selection
        setFormData((prev) => ({
            ...prev,
            location: {
                ...prev.location,
                coordinates: {
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                },
                // Auto-fill address, city, and province if available
                address: locationData.address || prev.location.address,
                city: locationData.city || prev.location.city,
                province: locationData.province || prev.location.province,
            },
        }))

        // Clear related errors
        setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.address
            delete newErrors.city
            delete newErrors.province
            delete newErrors.latitude
            delete newErrors.longitude
            return newErrors
        })
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.name.trim()) newErrors.name = "Branch name is required"
        if (!formData.location.address.trim()) newErrors.address = "Address is required"
        if (!formData.location.city.trim()) newErrors.city = "City is required"
        if (!formData.location.province.trim()) newErrors.province = "Province is required"
        if (!formData.contact.phone.trim()) newErrors.phone = "Phone is required"
        if (!formData.contact.email.trim()) newErrors.email = "Email is required"
        else if (!/^\S+@\S+\.\S+$/.test(formData.contact.email)) newErrors.email = "Invalid email format"



        // Validate coordinates
        const lat = formData.location.coordinates.latitude
        const lng = formData.location.coordinates.longitude
        if (lat < -90 || lat > 90) newErrors.latitude = "Latitude must be between -90 and 90"
        if (lng < -180 || lng > 180) newErrors.longitude = "Longitude must be between -180 and 180"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)
        try {
            console.log("Submitting form data:", formData)
            await onSubmit(formData)
        } catch (error) {
            console.error("Form submission error:", error)
        } finally {
            setLoading(false)
        }
    }

    // Loading spinner component
    const LoadingSpinner = ({ size = "sm" }) => (
        <div
            className={`animate-spin rounded-full border-b-2 border-red-600 ${size === "sm" ? "h-4 w-4" : "h-8 w-8"}`}
        ></div>
    )

    // Error message component
    const ErrorMessage = ({ message }) => (
        <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
            </svg>
            <span>{message}</span>
        </div>
    )

    if (showMap) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-gray-200">
                    <MapSelector
                        latitude={formData.location.coordinates.latitude}
                        longitude={formData.location.coordinates.longitude}
                        onLocationSelect={handleLocationSelect}
                        onClose={() => setShowMap(false)}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-gray-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">{branch ? "Edit Branch" : "Add New Branch"}</h2>
                        <p className="text-gray-600 mt-2">
                            {branch ? "Update branch details and settings" : "Create a new cinema branch location"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={onCancel} variant="outline" size="sm" className="border-gray-300 bg-transparent">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                        </Button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-8">
                        {/* Basic Information */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Building className="w-5 h-5 mr-2 text-red-600" />
                                Basic Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Branch Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter branch name (e.g., CGV Aeon Mall Bình Tân)"
                                        className={`${errors.name ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                    />
                                    {errors.name && <ErrorMessage message={errors.name} />}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                                    <Input
                                        name="image"
                                        value={formData.image}
                                        onChange={handleChange}
                                        placeholder="Enter image URL (optional)"
                                        className="px-4 py-3"
                                    />
                                </div>


                                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <label className="text-sm font-medium text-gray-700">Active Branch</label>
                                    <span className="text-xs text-gray-500">(Inactive branches won't appear in customer searches)</span>
                                </div>
                            </div>
                        </div>

                        {/* Location Information */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-red-600" />
                                    Location Information
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMap(true)}
                                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                                >
                                    <Map className="h-4 w-4" />
                                    Select on Map
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Address <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="location.address"
                                        value={formData.location.address}
                                        onChange={handleChange}
                                        placeholder="Enter full address (will be auto-filled when selecting on map)"
                                        className={`${errors.address ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                    />
                                    {errors.address && <ErrorMessage message={errors.address} />}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location.city"
                                            value={formData.location.city}
                                            onChange={handleChange}
                                            placeholder="Enter city (auto-filled from map)"
                                            className={`${errors.city ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                        />
                                        {errors.city && <ErrorMessage message={errors.city} />}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Province <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location.province"
                                            value={formData.location.province}
                                            onChange={handleChange}
                                            placeholder="Enter province (auto-filled from map)"
                                            className={`${errors.province ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                        />
                                        {errors.province && <ErrorMessage message={errors.province} />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Latitude <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location.coordinates.latitude"
                                            type="number"
                                            step="any"
                                            value={formData.location.coordinates.latitude}
                                            onChange={handleChange}
                                            placeholder="Auto-filled from map"
                                            className={`${errors.latitude ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                        />
                                        {errors.latitude && <ErrorMessage message={errors.latitude} />}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Longitude <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            name="location.coordinates.longitude"
                                            type="number"
                                            step="any"
                                            value={formData.location.coordinates.longitude}
                                            onChange={handleChange}
                                            placeholder="Auto-filled from map"
                                            className={`${errors.longitude ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                        />
                                        {errors.longitude && <ErrorMessage message={errors.longitude} />}
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        💡 <strong>Tip:</strong> Click "Select on Map" to automatically fill address, city, province, and
                                        coordinates by selecting a location on the map.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Phone className="w-5 h-5 mr-2 text-red-600" />
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="contact.phone"
                                        value={formData.contact.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number (e.g., 02812345678)"
                                        className={`${errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                    />
                                    {errors.phone && <ErrorMessage message={errors.phone} />}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        name="contact.email"
                                        type="email"
                                        value={formData.contact.email}
                                        onChange={handleChange}
                                        placeholder="Enter email address"
                                        className={`${errors.email ? "border-red-500 bg-red-50" : "border-gray-300"} px-4 py-3`}
                                    />
                                    {errors.email && <ErrorMessage message={errors.email} />}
                                </div>
                            </div>
                        </div>

                        {/* Operating Hours */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-red-600" />
                                Operating Hours
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                                    <Input
                                        name="operatingHours.open"
                                        type="time"
                                        value={formData.operatingHours.open}
                                        onChange={handleChange}
                                        className="px-4 py-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                                    <Input
                                        name="operatingHours.close"
                                        type="time"
                                        value={formData.operatingHours.close}
                                        onChange={handleChange}
                                        className="px-4 py-3"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Facilities */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Facilities & Amenities</h3>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newFacility}
                                        onChange={(e) => setNewFacility(e.target.value)}
                                        placeholder="Add facility (e.g., Parking, Food court, IMAX)"
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFacility())}
                                        className="px-4 py-3"
                                    />
                                    <Button type="button" onClick={addFacility} size="sm" className="px-4 py-3">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {formData.facilities.map((facility, index) => (
                                        <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                            {facility}
                                            <button type="button" onClick={() => removeFacility(facility)} className="ml-1 hover:text-red-500">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>

                                {formData.facilities.length === 0 && (
                                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-sm">No facilities added yet</p>
                                        <p className="text-xs">Add facilities like parking, food court, accessibility features, etc.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8 bg-gray-50 -mx-6 px-6 py-6 rounded-b-lg">
                        <div className="text-sm text-gray-500">
                            <span className="text-red-500">*</span> Required fields
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="button" onClick={onCancel} variant="outline" className="px-6 py-3 bg-transparent">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="px-8 py-3 bg-red-600 hover:bg-red-700">
                                {loading ? (
                                    <div className="flex items-center">
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2">{branch ? "Updating..." : "Creating..."}</span>
                                    </div>
                                ) : branch ? (
                                    "Update Branch"
                                ) : (
                                    "Create Branch"
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default BranchForm
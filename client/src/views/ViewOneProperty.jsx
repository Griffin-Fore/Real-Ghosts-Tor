import {useEffect, useState } from "react"
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom';

// ViewOneProperty Page
const ViewOneProperty = () => {
    const navigate = useNavigate()
    const {currentUserId, propertyId} = useParams()
    const [currentUser, setCurrentUser] = useState({})
    const [property, setProperty] = useState({})
    const [editedProperty, setEditedProperty] = useState({})
    const [editedPropertyErrors, setEditedPropertyErrors] = useState({})
    const [isEditPropertyPopupOpen, setIsEditPropertyOpen] = useState(false)
    const [allOffersForThisProperty, setAllOffersForThisProperty] = useState([])
    const [pendingDelete, setPendingDelete] = useState(false)
    const [pendingOffer, setPendingOffer] = useState({offer_amount: 0})
    const [pendingOfferErrors, setPendingOfferErrors] = useState({})
    const [pendingEditOfferErrors, setPendingOfferEditErrors] = useState({})
    const [myOffer, setMyOffer] = useState(null)
    const [isOfferEditPopupOpen, setIsOfferEditPopupOpen] = useState(false)
    const [isOfferDeletePopupOpen, setIsOfferDeletePopupOpen] = useState(false)
    const [isAcceptOfferPopupOpen, setIsAcceptOfferPopupOpen] = useState(false)
    const [pendingWinningOffer, setPendingWinningOffer] = useState({})
    const [pendingBookmark, setPendingBookmark] = useState({})
    const [myBookmark, setMyBookmark] = useState(null)
    const [allBookmarks, setAllBookmarks] = useState(null)
    const [isRelistPopupOpen, setIsRelistPopupOpen] = useState(false)
    let [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    // useEffect get current user from axios
    const fetchUser = async () => {
        console.log("ViewOneProperty.jsx useEffect currentUserId: ", currentUserId)
        try {
            const response = await axios.get(`http://localhost:8000/api/users/${currentUserId}`)
            console.log("ViewOneProperty.jsx getOneUser currentUserId res.data: ", response.data)
            setCurrentUser(response.data)
            setPendingOffer({...pendingOffer,
                bidder_user_id: response.data._id,
                bidder_username: response.data.username})
        } catch (err) {
            console.log("ViewOneProperty.jsx fetchUser catch err: ", err)
        }
    }

    // useEffect pull property from axios, set property and editProperty,
        // with a dependency of property
    
    const fetchProperty = async () => {
        console.log("ViewOneProperty.jsx getOneProperty useEffect")
        try {
            const response = await axios.get(`http://localhost:8000/api/properties/${propertyId}`)
            console.log("ViewOneProperty.jsx getOneProperty axios then res.data: ", response.data)
            setProperty(response.data)
            setEditedProperty(response.data)
            setPendingOffer({...pendingOffer,
                property_id: response.data._id,
                property_name: response.data.property_name,
                lister_id: response.data.lister_user_id,
                lister_username: response.data.lister_username,
                bidder_user_id: currentUserId,
                bidder_username: currentUser.username
            })
            setPendingBookmark({
                creator_user_id: currentUserId,
                lister_username: response.data.lister_username,
                lister_user_image: response.data.lister_user_image,
                property_id: response.data._id,
                property_name: response.data.property_name,
                property_photo_url: response.data.property_photo_url,
                asking_price: response.data.asking_price,
                sell_or_rent: response.data.sell_or_rent,
                property_type: response.data.property_type,
                square_footage: response.data.square_footage,
                number_of_beds: response.data.number_of_beds,
                number_of_baths: response.data.number_of_baths,
                number_of_ghosts: response.data.number_of_ghosts,
                address: response.data.address,
                isSold: response.data.isSold,
                property_description: response.data.property_description
            })
            console.log("myBookmark: ", myBookmark)
        } catch (err) {
            console.log("ViewOneProperty.jsx getOneProperty axios catch err: ", err)
        }
    }

    const fetchBookmark =  async () => {
        console.log("ViewOneProperty.jsx fetchBookmark")
        try {
            const allBookmarks = await axios.get('http://localhost:8000/api/bookmarks')
            setAllBookmarks(allBookmarks.data)
            console.log("ViewOneProperty.jsx fetchBookmark allBookmarks: ", allBookmarks)
            const doesMyBookmarkExist = allBookmarks.data.filter(bookmark => bookmark.property_id == propertyId).filter(bookmark => bookmark.creator_user_id == currentUserId)
            if(doesMyBookmarkExist[0]) {
                setMyBookmark(doesMyBookmarkExist[0])
            }
            else {
                setMyBookmark(null)
            }
        } catch (err) {
            console.log("ViewOneProperty.jsx fetchBookmark catch err: ", err)
        }
    }

    useEffect(() => {
        fetchUser()
        fetchProperty()
        fetchOffers()
        fetchBookmark()
    },[pendingEditOfferErrors])

    // edited property change handler
    const editPropertyChangeHandler = (e) => {
        const { name, value, type } = e.target;
    
        if (type === 'radio') {
            setEditedProperty(prevProperty => ({
                ...prevProperty,
                [name]: value === "true"
            }));
        } else if (name === 'property_photos') {

            const photosArray = value.split(',').map(photo => photo.trim());
            

            setEditedProperty(prevProperty => ({
                ...prevProperty,
                [name]: photosArray
            }));
        } else {
            setEditedProperty(prevProperty => ({
                ...prevProperty,
                [name]: value
            }));
        }
    };

    // pass editedProperty into a patch for property
    // if successful, fetchProperty res.data and set editedProperty as res.data
    // if false, set editedPropertyErrors

    // edited property submit:
    const editedPropertyFormSubmission = (e) => {
        e.preventDefault()
        console.log('ViewOneProperty.jsx editedPropertyFormSubmission editedProperty', editedProperty)
        axios.patch(`http://localhost:8000/api/properties/${propertyId}`, editedProperty)
        .then((res) => {
            console.log("ViewOneProperty.jsx editedPropertyFormSubmission res.data: ", res.data)
            fetchProperty()
            setIsEditPropertyOpen(false)
        })
        .catch((err) => {
            console.log("ViewOneProperty.jsx editedPropertyFormSubmission catch err.response.data.errors", err.response.data.errors)
            setEditedPropertyErrors(err.response.data.errors)
        })
    }

    const openPropertyEditPopup = () => setIsEditPropertyOpen(true)

    const closePropertyEditPopup = () => {
        setEditedProperty(property)
        setEditedPropertyErrors({})
        setIsEditPropertyOpen(false)
    }

    // delete property function
    const openDeletePropertyPopup = () => setPendingDelete(true)

    const closeDeletePropertyPopup = () => setPendingDelete(false)

    const deletePropertyForReal = () => {
        console.log("ViewOneProperty.jsx deletePropertyForReal clicked")
        axios.delete(`http://localhost:8000/api/properties/${propertyId}`)
            .then((res) => {
                console.log("ViewOneProperty deletePropertyForReal then res.data: ", res.data)
                navigate(`/all_properties/${currentUserId}`)
            })
            .catch((err) => {
                console.log("ViewOneProperty.jsx deletePropertyForReal catch err: ", err)
            })
    }

    // fetchOffers not in a useEffect
    // gets all the offers
    // filter allOffersForThisProperty by propertyId
    // subsequent filters myOffersForThisProperty by currentUserId
    // if [0] exists, sets myOffer as myOffersForThisProperty[0]
    const fetchOffers = async () => {
        console.log("VIewOneProperty getAllOffers useEffect")
        try {
            const response = await axios.get('http://localhost:8000/api/offers')
            console.log("ViewOneProperty getAllOffers axioos try response.data: ", response.data)
            const allOffersForThis = response.data.filter(offer => offer.property_id == propertyId)
            setAllOffersForThisProperty(allOffersForThis)
            const justMyOfferForThisProperty  = allOffersForThis.filter(offer => offer.bidder_user_id == currentUserId)
            if(justMyOfferForThisProperty.length == 1){
                setMyOffer(justMyOfferForThisProperty[0])
                setPendingOffer(justMyOfferForThisProperty[0])
            }
            console.log("justMyOfferForThisProperty", justMyOfferForThisProperty)
            setLoading(false)
        } catch (err) {
            console.log("ViewOneProperty.jsx getAllOffers axios catch err: ", err)
        }
    }

    // BONUS: pending offer change handler
    const offerChangeHandler = (e) => {
        const { name, value } = e.target;
        setPendingOffer(prevOffer => ({
            ...prevOffer,
            [name]: value
        }))
        console.log("offerChangeHandler pendingOffer: ", pendingOffer)
    }

    const offerSubmissionForm = (e) => {
        e.preventDefault()
        // CURRENT PLACE 1
        if(pendingOffer.offer_amount < property.minimum_bid) {
            setPendingOfferErrors({offer_amount: "Offer cannot be less than property's minimum bid requirement."})
            console.log("pendingOfferErrors for less than minimum_bid: ", pendingOfferErrors)
            return
        }
        const newOffer = {
            ...pendingOffer,
            bidder_user_id: currentUser._id,
            bidder_username: currentUser.username,
            property_id: propertyId,
            property_name: property.property_name,
            lister_id: property.lister_user_id,
            lister_username: property.lister_username,
            
        }
        console.log("currentUser.username: ", currentUser.username)
        console.log("ViewOneProperty.jsx offerSubmissionForm pendingOffer: ", newOffer)
        axios.post('http://localhost:8000/api/offers', newOffer, {withCredentials: true})
            .then((res) => {
                console.log("ViewOneProperty.jsx")
                const newOfferId = res.data._id
                console.log("res.data._id", res.data._id)
                const newIdArray = [...property.offer_ids, newOfferId]
                const propertyCopy = {...property, offer_ids: newIdArray}
                axios.patch(`http://localhost:8000/api/properties/${propertyId}`, propertyCopy)
                console.log("propertyCopy", propertyCopy)
                fetchUser()
                fetchProperty()
                fetchOffers()
            })
            .catch((err) => {
                console.log("ViewOneProperty.jsx offerSubmissionForm catch err.response: ", err.response.data.errors)
                setPendingOfferErrors(err.response.data.errors)
            })
    }

    // offer edit window open function
    const openOfferEditPopup = () => setIsOfferEditPopupOpen(true)

    const closeOfferEditPopup = () => {
        setIsOfferEditPopupOpen(false)
        setPendingOffer(myOffer)
    }

    const editOfferSubmissionHandler = (e) => {
        e.preventDefault()
        const editOffer = ({
            ...pendingOffer,
            _id: myOffer._id
        })
        console.log("editOfferSubmissionHandler pendingOffer._id", editOffer._id)
        console.log("ViewOneProperty.jsx editOfferSubmissionHandler pendingOffer", editOffer)
        axios.patch(`http://localhost:8000/api/offers/${editOffer._id}`, editOffer)
        .then((res) => {
            console.log("ViewOneProperty.jsx editOfferSubmissionHandler then res.data: ", res.data)
            fetchProperty()
            fetchOffers()
            setIsOfferEditPopupOpen(false)
            console.log("myOffer: ", myOffer)
        })
        .catch((err) => {
            console.log("ViewOnePropertty.jsx editeeOfferSubmissionHandler err.response.data: ", err.response.data.errors)
            console.log("editOffer id: ", editOffer._id)
            setPendingOfferEditErrors(err.response.data.errors)
        })
    }

    const openDeletOfferPopup = () => setIsOfferDeletePopupOpen(true)

    const closeDeleteOfferPopup = () => setIsOfferDeletePopupOpen(false)

    // Bonus deleteOffer
    const deleteOfferForReal = () => {
        if(myOffer){
            console.log("myOffer", myOffer)
        const allOffersMinusMine = property.offer_ids.filter(offerId => offerId !== myOffer._id)
        const propertyCopy = {...property, offer_ids: allOffersMinusMine}
        console.log("propertyCopy", propertyCopy)
        axios.patch(`http://localhost:8000/api/properties/${property._id}`, propertyCopy)
        .then((res) => {
            console.log("ViewOneProperty.jsx deleteOfferForReal propertyCopy then res.data: ", res.data)
            fetchProperty()
            axios.delete(`http://localhost:8000/api/offers/${myOffer._id}`)
                .then((res) => {
                    console.log("ViewOneProperty.jsx deleteOfferForReal deleteOffer then res.data: ", res.data)
                    setMyOffer(null)
                    fetchUser()
                    fetchProperty()
                    fetchOffers()
                    setIsOfferEditPopupOpen(false)
                    setIsOfferDeletePopupOpen(false)
                })
                .catch((err) => {
                    console.log("ViewOneProperty.jsx deleteOfferForReal deleteOffer catch err: ", err)
                })
        })
        .catch((err) => {
            console.log("ViewOneProperty.jsx deleteOfferForReal propertyCopy catch err: ", err)
        })}
        else {
            console.log("ViewOneProperty.jsx deleteOfferForReal myOffer doesn't exist")
        }
    }

    // accept offer popup
    const openAcceptOfferPopup = (offer) => {
        setPendingWinningOffer(offer)
        setIsAcceptOfferPopupOpen(true)
    }

    // accept offer confirm
        // axios patch the property with the winning offer info,
        // set the isSold to sold
        // fetchProperty
    const acceptOfferForReal = () => {
        console.log("working acceptOfferForReal")
        const propertyCopy = {...property,
            isSold: true,
            winning_bid_amount: pendingWinningOffer.offer_amount,
            winning_bidder_user_id: pendingWinningOffer.bidder_user_id,
            winning_bidder_username: pendingWinningOffer.bidder_username
        }
        console.log("ViewOneProperty acceptOfferForReal propertyCopy: ", propertyCopy)
        axios.patch(`http://localhost:8000/api/properties/${propertyId}`, propertyCopy)
            .then((res) => {
                console.log("ViewOneProperty.jsx acceptOfferForReal axios res.data: ", res.data)
                fetchProperty()
                setIsEditPropertyOpen(false)
                const deleteLosingOfferPromises = [];
                allOffersForThisProperty.forEach((offer) => {
                    deleteLosingOfferPromises.push(axios.delete(`http://localhost:8000/api/offers/${offer._id}`))
                })

                Promise.all(deleteLosingOfferPromises)
                    .then(() => {
                        console.log("All losing offers deleted successfully")
                    })
                    .catch((err) => {
                        console.log("Error deleting offers")
                    })
            })
            .catch((err) => {
                console.log("ViewOneProperty.jsx acceptOfferForReal catch err: ", err)
            })
        fetchProperty()
        setIsAcceptOfferPopupOpen(false)
    }

    // close offer popup
    const closeAcceptOfferPopup = () => {
        setIsAcceptOfferPopupOpen(false)
    }
    // CREATE MULTIPLE OFFERS

    const toggleBookmark = () => {
        console.log("toggleBookmark clicked successfully")
        if(myBookmark) {
            axios.delete(`http://localhost:8000/api/bookmarks/${myBookmark._id}`)
            .then((res) => {
                console.log("ViewOneProperty toggleBookmark deleteBookmark then res.data: ", res.data)
                fetchBookmark()
            })
            .catch((err) => {
                console.log("ViewOneProperty.jsx toggleBookmark deleteBookmark catch err: ", err)
            })
        } else {
            console.log("pendingBookmark", pendingBookmark)
            axios.post('http://localhost:8000/api/bookmarks', pendingBookmark, {withCredentials: true})
                .then((res) => {
                    console.log("ViewOneProperty toggleBookmark createBookmark then res.data: ", res.data)
                    fetchBookmark()
                })
                .catch((err) => {
                    console.log("ViewOneProperty toggleBookmark createBookmark catch err: ", err)
                })
        }
    }

    // logout function
    const logout = () => {
        axios.post('http://localhost:8000/api/logout', {}, {withCredentials: true})
            .then(() => {
                localStorage.removeItem("currentUser");
                navigate('/')
            })
            .catch((err) => {
                console.log("ViewAllProperties logout catch err: ", err)
            })
    }
    
    // home function
    const toHome = () => navigate(`/all_properties/${currentUserId}`)

    // my profile function
    const toMyAccount = () => navigate(`/profiles/${currentUserId}/${currentUserId}`)

    // to lister
    const toLister = (lister_user_id) => navigate(`/profiles/${currentUserId}/${lister_user_id}`)

    const pictureRight = () => {
        if(currentImageIndex < property.property_photos.length - 1){
            setCurrentImageIndex(currentImageIndex + 1)
        }
        if(currentImageIndex == property.property_photos.length - 1){
            setCurrentImageIndex(0)
        }
    }

    const pictureLeft = () => {
        if(currentImageIndex === 0){
            setCurrentImageIndex(property.property_photos.length - 1);
        } else {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    }

    const openRelistPopup = () => setIsRelistPopupOpen(true)

    const cancelRelist = () => {
        setEditedProperty(property)
        console.log("Property", property)
        setIsRelistPopupOpen(false)
    }

    const confirmRelist = () => {
        const propertyCopy = {...property,
            lister_user_id: currentUser._id,
            lister_username: currentUser.username,
            lister_user_image: currentUser.user_image_url,
            isSold: false,
            winning_bid_amount: 0,
            winning_bidder_user_id: '',
            winning_bidder_username: ''
        }
        console.log("confirmRelist propertyCopy to be set as property: ", propertyCopy)
        axios.patch(`http://localhost:8000/api/properties/${propertyId}`, propertyCopy)
        .then((res) => {
            console.log("ViewOneProperty.jsx confirmRelist res.data: ", res.data)
            fetchProperty()
            setIsRelistPopupOpen(false)
            if(myBookmark) {
                axios.delete(`http://localhost:8000/api/bookmarks/${myBookmark._id}`)
                .then((res) => {
                    console.log("ViewOneProperty toggleBookmark deleteBookmark then res.data: ", res.data)
                    fetchBookmark()
                })
                .catch((err) => {
                    console.log("ViewOneProperty.jsx toggleBookmark deleteBookmark catch err: ", err)
                })
            }
        })
        .catch((err) => {
            console.log("ViewOneProperty.jsx editedPropertyFormSubmission catch err", err)
        })
        // CURRENT
    }
    
    const toBidderProfile = (bidder_id) => navigate(`/profiles/${currentUserId}/${bidder_id}`)

    // loading
    if(loading) {
        return <div>Loading...</div>
    }

    return (
        <div className='container shadow-lg' style={{backgroundColor: '#f0f0f0'}}>
            <div className="row " style={{borderBottom: '2px solid black'}}>
                <button className='col-md btn btn-secondary'onClick={() => logout()}>Log Out</button>
                <button className='col-md btn offset-sm-1 btn-primary'onClick={()=> toMyAccount()}>My Account</button>
                <button className='col-md offset-md-2 btn btn-primary'onClick={() => toHome()}>To Home</button>
            </div>
            {/* NOTE: please make this a ribbon on the top of the window and to the side */}
            {myBookmark && <h1 style={{color: 'white', background: 'blue',width: '21%'}}>Bookmarked</h1>}
            {currentUserId !== property.lister_user_id && <button style={{border: '1px solid blue'}} className="btn" onClick={() => toggleBookmark()}>Bookmark</button>}
            <div className="row "> {/* property info*/}
                {/* // Name of seller that links to user's profile */}
                {/* seller image */}
                {property.winning_bidder_user_id == currentUserId && <button onClick={() => openRelistPopup()}>Relist</button>}
                {isRelistPopupOpen &&
                    <div>
                        <button onClick={() => cancelRelist()}>Cancel</button>
                        <button onClick={() => confirmRelist()}>Confirm Relist</button>
                    </div>
                }
                {/* Picture */}
                <div className="row">
                    <h1 className="offset-sm-1">{property.property_name}</h1>
                    <div className="col">
                        {!property.property_photos || property.property_photos.length === 0 &&
                            <img className='shadow-lg' style={{height: '350px', width: '500px'}} src={property.property_photo_url}/>
                        }
                        <div></div>
                        {/* // BONUS: Pictures array that has arrow buttons to go forward and back to the different picture */}

                        {property.property_photos && property.property_photos[currentImageIndex] &&
                        <div className="row">
                            <button onClick={() => pictureLeft()}>&lt;</button>
                            <img className="row" style={{height: '350px', width: '500px'}} src={property.property_photos[currentImageIndex]}/>
                            <button onClick={() => pictureRight()}>&gt;</button>
                        </div>}
                        <div style={{height: '60px', width: '180px'}}>
                            {property.isSold ? "" : (property.sell_or_rent ? <p> For Sale</p> : <p>For Rent</p>)}
                        </div> 
                        
                        {property.isSold ? <p className="col-md-1 fs-5" style={{color: 'red'}}>Sold!</p> : ""}
                        <div style={{height: '60px', width: '180px'}}>

                            {property.isSold ? <p>Sold for: ${Number(property.winning_bid_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p> : <p>Asking Price: ${Number(property.asking_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>}
                        

                        <div style={{height: '60px', width: '180px'}}>
                            {!property.isSold && <p>Minimum bid allowed: ${property.minimum_bid}</p>}
                        </div>

                        </div>  
                        <div style={{height: '60px', width: '300px'}}>
                            <p>Address: {property.address}</p>
                        </div>
                        <div>
                            <p>{property.property_description}</p>
                        </div>
                    </div>
                    <div className="col">

                        <div style={{height: '60px', width: '180px'}}>
                            <p>Property Type: {property.property_type}</p>
                        </div>
                        <div style={{height: '60px', width: '180px'}}>
                            <p>Square Footage: {property.square_footage} sq/ft</p>
                        </div>
                        <div style={{height: '60px', width: '180px'}}>
                            <p>Number of Bedrooms: {property.number_of_beds}</p>
                        </div>
                        <div style={{height: '60px', width: '180px'}}>
                            <p>Number of Bathrooms: {property.number_of_baths}</p>
                        </div>
                        <div style={{height: '60px', width: '180px'}}>
                            <p>Number of Ghosts: {property.number_of_ghosts}</p>
                        </div>
                    </div>


                </div>

                <div style={{border: '2px solid black'}}>
                    <p>Listing Agent: {property.lister_username}</p>
                    <img className="col-md-1" src={property.lister_user_image} style={{height: '75px', width: '75px'}} />
                    <button className="btn btn-lg btn-primary" onClick={() => toLister(property.lister_user_id)} style={{height: '60px', width: '270px', padding: '10px'}}>
                        <p>To Listing Agents Profile</p>
                    </button>
                </div>
                {/* // BONUS: if sold or rented: Buyer information */}
                {property.isSold && 
                    <div>
                        
                        {property.sell_or_rent == "sell" &&
                            <p>Closed for ${Number(property.winning_bid_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} by {property.winning_bidder_username}</p>
                        }
                        {property.sell_or_rent == "rent" && 
                            <p>Closed for ${Number(property.winning_bid_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} per month by {property.winning_bidder_username}</p>
                        }
                    </div>}
            </div>

            {/* // If property is posted by current user */}
            {property.lister_user_id == currentUserId &&
                <div>
                        {/* // Edit button that opens a popup form with the same structure as the page */}
                        <button onClick={() => openPropertyEditPopup()} className="btn btn-primary">Edit</button>
                        {/* popup edit property form */}
                        {isEditPropertyPopupOpen &&
                            // edit form
                            <div className='row shadow-lg' style={{position: 'fixed', top: '50%', left: '50%',border: '2px solid black' , transform: 'translate(-50%, -50%)', backgroundColor: '#DFDFDF'}}>
                                <p></p>
                                <button onClick={() => closePropertyEditPopup()} className="col-md-2 btn btn-secondary offset-sm-9">Cancel</button>
                                <form onSubmit={editedPropertyFormSubmission}>
                                    <div className="row">
                                        <p></p>
                                        <div className="col">
                                            <div className="col-md-3">
                                                <label htmlFor="property_name">Property Name:</label>
                                                <input id="property_name" type="text" name="property_name" value={editedProperty.property_name} onChange={editPropertyChangeHandler}/>
                                                {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.property_name?.message}</p>}
                                            </div>
                                            
                                            <div className="col-md-3">
                                                <label htmlFor="property_photo_url">Property Photo URL:</label>
                                                <input id="property_photo_url" type="text" name="property_photo_url" value={editedProperty.property_photo_url} onChange={editPropertyChangeHandler}/>
                                                {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.property_photo_url?.message}</p>}
                                            </div>
                                            <div className="col-md-3">
                                                <label htmlFor="property_photos">Photos Enter EX: &quot;urlOne&quot;,&quot;urlTwo&quot;,&quot;urlThree&quot;</label>
                                                <input id="property_photos" type="text" name="property_photos" value={editedProperty.property_photos} onChange={editPropertyChangeHandler}/>
                                            </div>
                                            <p></p>
                                            <div className="col-md-3">
                                                <label htmlFor="asking_price">Asking Price</label>
                                                <input id="asking_price" type="number" name="asking_price" value={editedProperty.asking_price} onChange={editPropertyChangeHandler}/>
                                                {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.asking_price?.message}</p>}
                                            </div>
                                            <div className="col-md-3">
                                                <label>Sell Or Rent?</label>
                                                <div style={{display: "flex", alignItems: "center"}}>
                                                    <label htmlFor="sell">Sell:</label>
                                                    <input id="sell" type="radio" name="sell_or_rent" value="true" checked={editedProperty.sell_or_rent == true} onChange={editPropertyChangeHandler}/>
                                                    <label htmlFor="rent">Rent:</label>
                                                    <input id="rent" type="radio" name="sell_or_rent" value="false" checked={editedProperty.sell_or_rent == false} onChange={editPropertyChangeHandler}/>
                                            </div>
                                                
                                            </div>
                                                
                                            <div className="col-md-3">
                                                <label htmlFor="property_type">Property Type:</label>
                                                <select id="property_type" name="property_type" value={editedProperty.property_type} onChange={editPropertyChangeHandler}>
                                                    <option value="House">House</option>
                                                    <option value="Apartment">Apartment</option>
                                                    <option value="Condo">Condo</option>
                                                    <option value="Townhouse">Townhouse</option>
                                                </select>
                                                {editedPropertyErrors.property_type && <p style={{color: "red"}}>Property must have a type</p>}
                                            </div>
                                        </div>
                                        <div className="col">
                                        <div className="col-md-3">
                                            <label htmlFor="square_footage">Square Footage</label>
                                            <input id="square_footage" type="number" name="square_footage" value={editedProperty.square_footage} onChange={editPropertyChangeHandler}/>
                                            {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.square_footage?.message}</p>}
                                        </div>
                                        <div className="col-md-3">
                                            <label htmlFor="number_of_beds">Number of Beds</label>
                                            <input id="number_of_beds" type="number" name="number_of_beds" value={editedProperty.number_of_beds} onChange={editPropertyChangeHandler}/>
                                            {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.number_of_beds?.message}</p>}
                                        </div>
                                        <div className="col-md-3">
                                            <label htmlFor="number_of_baths">Number of Bathrooms</label>
                                            <input id="number_of_baths" type="number" name="number_of_baths" value={editedProperty.number_of_baths} onChange={editPropertyChangeHandler}/>
                                            {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.number_of_baths?.message}</p>}
                                        </div>
                                        <div className="col-md-3">
                                            <label htmlFor="number_of_ghosts">Number of Ghosts</label>
                                            <input id="number_oof_ghosts" type="number" name="number_of_ghosts" value={editedProperty.number_of_ghosts} onChange={editPropertyChangeHandler}/>
                                            {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.number_of_ghosts?.message}</p>}
                                        </div>
                                        <div className="col-md-4">
                                            <label htmlFor="address">Address</label>
                                            <input id="address" type="text" name="address" value={editedProperty.address} onChange={editPropertyChangeHandler}/>
                                            {editedPropertyErrors && <p style={{color: 'red'}}>{editedPropertyErrors.address?.message}</p>}
                                        </div>
                                        <div className="col-md-12">
                                            <label htmlFor="property_description">Property Description</label>
                                            <textarea id="property_description" className="form-control w-400 h-100" style={{maxWidth: '400px', maxHeight: '100px'}} name="property_description" value={editedProperty.property_description} onChange={editPropertyChangeHandler}/>
                                            {editedPropertyErrors.property_description && <p style={{color: 'red'}}>{editedPropertyErrors.property_description?.message}</p>}
                                        </div>
                                        <button className="col-md-5 btn btn-primary offset-sm-3">Submit New Edit</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        }
                        {/* // Delete button */}
                        <button onClick={() => openDeletePropertyPopup()} className="btn btn-secondary">Delete</button>
                        {/* //BONUS: Table of offer if current user == lister user id*/}
                        {/* {!property.isSold &&  */}

                        <div>
                            {property.isSold ? (
                                <p>This property is sold</p>
                            ) : (
                                <div className="row">
                                    <div className="col-md-6">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Bidder</th>
                                                    <th>Offer Amount</th>
                                                    <th>Accept Offer?</th>
                                                </tr>
                                            </thead>
                                            <tbody style={{ borderBottom: '2px solid black' }}>
                                                {allOffersForThisProperty.map((offer, index) => (
                                                    <tr key={offer._id} style={{ borderBottom: '1px solid black' }}>
                                                        <td>
                                                            <button className="btn" onClick={() => toBidderProfile(offer.bidder_user_id)}>{offer.bidder_username}</button>
                                                        </td>
                                                        <td>${offer.offer_amount}</td>
                                                        <td><button onClick={() => openAcceptOfferPopup(offer)} className="btn btn-primary">Accept</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* } */}
                        {isAcceptOfferPopupOpen &&
                            <div  style={{marginBottom: '50px'}}>
                                <p>All Offers Are Final</p>
                                {/* set as selectedOffer the offer, then set isAcceptOfferPopupOpen to true CURRENT_PLACE*/}
                                <button onClick={() => closeAcceptOfferPopup()} className="btn btn-secondary">Cancel</button>
                                <button onClick={() => acceptOfferForReal()} className="offset-sm-1 btn btn-primary">Finalize Offer</button>
                            </div>
                        }
                        {/* // accept button */}
                        {/* // bid */}
                        {/* // username that links to user's profile */}
                        {/* // Upon clicking accept on a bid, popup that asks for confirmation, and upon confirmation,  */}
                        {/* // sets the property's winning bidder information to the bidding user and sets the property to sold,  */}
                        {/* // sets the winning bid as the bid attached to the property model */}
                </div>
            }
            {pendingDelete &&
                <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                    {/* please make the delete red and in both in a column */}
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)'}}>
                        <p className="text-light">Are you sure you want to delete this listing?</p>
                    <button onClick={() => closeDeletePropertyPopup()} className="btn offset-sm-2 btn-warning" style={{border: '1px solid black'}}>Cancel</button>
                    <button onClick={() => deletePropertyForReal()} className="btn offset-sm-1 btn-danger" style={{border: '1px solid black'}}>Delete</button>
                    <p className="text-light">This decision will be FINAL!</p>
                    </div>
                </div>
            }

    {/* BONUS: make offer window and lists my offer, with edit and delete */}
    {/* window to submit offer */}
    {!property.isSold && currentUserId !== property.lister_user_id && !myOffer &&
        <div>
            <p className="fs-2">Would you like to make an offer on this listing?</p>
            <form onSubmit={offerSubmissionForm}>
                <label htmlFor="offer_amount">Offer Amount:</label>
                <input id="offer_amount" type="number" name="offer_amount" value={pendingOffer.offer_amount} onChange={offerChangeHandler}/>
                {pendingOfferErrors.offer_amount && <p style={{color: "red"}}>{pendingOfferErrors?.offer_amount}</p>}
                <button className="btn btn-primary">Make Offer</button>
            </form>
        </div>
    }
    {/* CURRENT PLACE 2 */}
    {currentUserId !== property.lister_user_id && myOffer &&
        <div>
                <div >
                    <p>My Offer: </p>
                    <p>${myOffer.offer_amount}.00</p>
                    <div style={{marginBottom: '50px'}}>
                        <button  onClick={() => openOfferEditPopup()} className="btn btn-primary">Edit Offer</button>
                        <button onClick={() => openDeletOfferPopup()} className="btn btn-secondary">Delete Offer</button>
                    </div>
                </div>
                {isOfferEditPopupOpen && myOffer &&
                    <div>
                        <form onSubmit={editOfferSubmissionHandler}>
                            <label htmlFor="offer_amount">Offer Amount:</label>
                            <input id="offer_amount" type="number" name="offer_amount" value={pendingOffer.offer_amount} onChange={offerChangeHandler}/>
                            {pendingEditOfferErrors.offer_amount && <p>{pendingEditOfferErrors.offer_amount?.message}</p>}
                            <button className="btn btn-primary">Make Offer</button>
                        </form>
                        <button style={{marginBottom: '50px'}} onClick={() => closeOfferEditPopup()} className="btn btn-secondary">Cancel</button>
                    </div>
                }
                {isOfferDeletePopupOpen && myOffer &&
                    <div className="shadow-lg" style={{position: 'fixed', top: '60%', left: '50%', transform: 'translate(-50%, -50%)', border: '2px solid black',backgroundColor: '#f0f0f0'}}>
                    <h1>Delete Offer?</h1>
                        <button className="btn btn-secondary" onClick={() => closeDeleteOfferPopup()}>Cancel</button>
                        <button className="btn btn-warning" onClick={() => deleteOfferForReal()}>Delete</button>
                    </div>
                }
                </div>
            }
        </div>
    )
}

export default ViewOneProperty
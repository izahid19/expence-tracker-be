const Validator = require("validator");
const validationForSignup = (req) => {
    const { firstName, lastName, emailId, password } = req.body;
    if(!firstName || !lastName){
        throw new Error("firstName and lastName are required");
    }
    else if(firstName.length < 3 || lastName.length > 40){
        throw new Error("firstName and lastName should be between 3 and 40 characters");
    }
    else if(!Validator.isEmail(emailId)){
        throw new Error("email is invalid");
    } else if(!Validator.isStrongPassword(password)){
        throw new Error("password is weak");
    }
    
};

const validationForLogin = (req) => {
    const { emailId, password } = req.body;
    if(!emailId || !password){
        throw new Error("email and password are required");
    }
    else if(!Validator.isEmail(emailId)){
        throw new Error("email is invalid");
    }
};

const validateEditProfileData = (req) => {
    const allowedFields = ["firstName", "lastName", "age", "gender", "profilePicture", "hobbies" , "desc" ];

    const isAllowedFeild = Object.keys(req.body).every((key) => allowedFields.includes(key));

    return isAllowedFeild;
    
}



module.exports = {validationForSignup, validationForLogin , validateEditProfileData};
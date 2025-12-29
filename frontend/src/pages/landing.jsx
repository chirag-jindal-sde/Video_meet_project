
import React from "react";
import "../App.css"
import { Link } from "react-router-dom";

export default function LandingPage(){
    return(
        <>
        <div className="landingPageContainer">
            <nav>
                <div className="nav-header">
                    <Link to="/home">
                        <h2>CJ Meet</h2>
                    </Link>
                </div>
                <div className="nav-list">
                    <Link to="/auth" className="nav-link">Register</Link>
                    <Link to="/auth" className="nav-button">
                        Login
                    </Link>
                </div>
            </nav>
            <div className="landingMainContainer">
                <div className="landing-content">
                    <h1>
                        <span className="highlight">Connect </span>
                        &nbsp;with your loved ones
                    </h1>
                    <p className="landing-subtitle">
                        Experience seamless video calling with CJ Meet - 
                        where every conversation matters
                    </p>
                    <div className="cta-button">
                        <Link to="/auth">Get Started</Link>
                    </div>
                </div>
                <div className="landing-image">
                    <div className="image-glow"></div>
                    <img src="/mobile.png" alt="CJ Meet Interface" />
                </div>
            </div>
        </div>
        </>
    )
}
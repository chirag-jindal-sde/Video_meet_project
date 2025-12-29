    import * as React from "react";
    import "../styles/authentication.css"; 
    import { useNavigate } from "react-router-dom";
    import InputAdornment from "@mui/material/InputAdornment";
    import IconButton from "@mui/material/IconButton";
    import Visibility from "@mui/icons-material/Visibility";
    import VisibilityOff from "@mui/icons-material/VisibilityOff";


    import {
    Box,
    Button,
    Checkbox,
    CssBaseline,
    Divider,
    FormControl,
    FormControlLabel,
    FormLabel,
    Link,
    TextField,
    Typography,
    Stack,
    Card,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    } from "@mui/material";
    import { styled } from "@mui/material/styles";
import { AuthContext } from "../contexts/authContext";

    const StyledCard = styled(Card)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignSelf: "center",
    width: "100%",
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    maxWidth: 450,
    }));

    const Container = styled(Stack)(({ theme }) => ({
    minHeight: "100vh",
    justifyContent: "center",
    alignItems: "center",
    }));


    /* ---------------- Main Component ---------------- */
    export default function Authentication() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);

    const [username, setUsername] = React.useState(""); 
    const [password, setPassword] = React.useState(""); 
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const { handleRegister, handleLogin } = React.useContext(AuthContext);
    const [name, setName] = React.useState("");


const handleAuth = async () => {
    try {
        if (formState === 0) {
        await handleLogin(username, password);
        setMessage("Login successful");
        navigate("/home");
        }
        if (formState === 1) {
        const msg = await handleRegister(name, username, password);
        setMessage(msg);
        setFormState(0);
        setPassword("");
        setUsername("");
        setName("");
        }
        setOpen(true);
        setError("");
    } catch (err) {
        setError(err.response?.data?.message || "Auth failed");
    }
};


    return (
        <>
        <div className="authentication">
        <CssBaseline />
        <Container>
            <StyledCard>
                <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                    <Button className="button-signin" variant={formState === 0 ? "contained" : "outlined"} onClick={() => setFormState(0)}>Sign In</Button>
                    <Button className="button-signup" variant={formState === 1 ? "contained" : "outlined"} onClick={() => setFormState(1)}>Sign Up</Button>
                </Box>
            <Box
            component="form"
            noValidate
            onSubmit={(e) => {
                e.preventDefault();
                handleAuth();
            }}
            >
                {formState === 1 && (
                <FormControl fullWidth margin="normal">
                <TextField
                    className="custom-textfield"
                    margin="normal"
                    required
                    fullWidth
                    label="Full Name"
                    id="fullname"
                    name="fullname"
                    value={name}
                    placeholder="Enter Your Full Name"
                    onChange={(e) => setName(e.target.value)}
                />
                </FormControl>
                )}
                
                <FormControl fullWidth margin="normal">
                <TextField
                    className="custom-textfield"
                    required
                    fullWidth
                    label="Username"
                    id="username"
                    name="username"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                </FormControl> 
                
                <FormControl fullWidth margin="normal">
                <TextField
                    className="custom-textfield"
                    required
                    fullWidth
                    label="Password"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                        <IconButton
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        </InputAdornment>
                    ),
                    }}
                />
                </FormControl>
                {error && <p style={{color:"red"}}>{error}</p>}
                <Button
                className="button-down"
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                >
                {formState === 0 ? "Login" : "Register"}
                </Button>
            </Box>
            <Divider></Divider>
            <Typography textAlign="center" fontSize={13} color="grey">
                Copyright &copy; <i>CJ's website</i> 2025
            </Typography>
            <Snackbar
            open={open}
            autoHideDuration={4000}
            message={message}
            onClose={() => setOpen(false)} 
            />
            </StyledCard>
        </Container>
        </div>
        </>
    );
}
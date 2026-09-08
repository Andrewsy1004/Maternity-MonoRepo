import styles from "./GradedButton.module.css"
interface GradedButtonProps { 
    width : string , 
    height : string,
    textbutton : string 
}

export const GradedButton = ({width , height ,  textbutton} : GradedButtonProps) => {
    return (
        <button className={styles.button} 
        style={{
            
            width : width,
            height : height
        }} >{textbutton}</button>
    )
}



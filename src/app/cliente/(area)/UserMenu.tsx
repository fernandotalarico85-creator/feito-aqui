import UserMenuDropdown, { UserMenuLink } from "@/components/UserMenuDropdown";

/**
 * Menu do usuário logado (Prompts 15 e 18) — todos os itens de navegação do cliente
 * ficam dentro do dropdown do nome, como lista única; "+ Novo Pedido" continua fora
 * do dropdown, na barra horizontal, por ser uma ação/CTA principal, não um item de
 * navegação.
 */
export default function UserMenu({
  nome,
  sairAction,
}: {
  nome: string;
  sairAction: (formData: FormData) => void;
}) {
  return (
    <UserMenuDropdown label={nome}>
      <UserMenuLink href="/cliente/pedidos">Meus Pedidos</UserMenuLink>
      <UserMenuLink href="/cliente/carteira">Minha Carteira</UserMenuLink>
      <UserMenuLink href="/cliente/perfil">Perfil</UserMenuLink>
      <form action={sairAction}>
        <button
          type="submit"
          className="block w-full border-t border-stone-100 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
        >
          Sair
        </button>
      </form>
    </UserMenuDropdown>
  );
}
